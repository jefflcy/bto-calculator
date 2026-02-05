import './style.css'

document.addEventListener('DOMContentLoaded', function() {
    var calcBtn = document.getElementById('calculateButton');
    if (calcBtn) {
        calcBtn.addEventListener('click', function() {
            calculate();
        });
    }
});

document.querySelectorAll('.option-row').forEach(function(row) {
    var inputId = row.getAttribute('data-name');
    var input = document.getElementById(inputId);
    row.querySelectorAll('.bubble').forEach(function(bubble) {
        bubble.addEventListener('click', function() {
            row.querySelectorAll('.bubble').forEach(function(b) { b.classList.remove('selected'); });
            this.classList.add('selected');
            input.value = this.getAttribute('data-value');
        });
    });
});

function calculateBSD(price) {
    let bsd = 0;
    
    if (price <= 180000) {
        bsd = price * 0.01;
    } else if (price <= 360000) {
        bsd = 180000 * 0.01 + (price - 180000) * 0.02;
    } else if (price <= 1000000) {
        bsd = 180000 * 0.01 + 180000 * 0.02 + (price - 360000) * 0.03;
    } else if (price <= 1500000) {
        bsd = 180000 * 0.01 + 180000 * 0.02 + 640000 * 0.03 + (price - 1000000) * 0.04;
    } else if (price <= 3000000) {
        bsd = 180000 * 0.01 + 180000 * 0.02 + 640000 * 0.03 + 500000 * 0.04 + (price - 1500000) * 0.05;
    } else {
        bsd = 180000 * 0.01 + 180000 * 0.02 + 640000 * 0.03 + 500000 * 0.04 + 1500000 * 0.05 + (price - 3000000) * 0.06;
    }
    
    return Math.max(1, Math.floor(bsd));
}

function calculateConveyancingBase(amount) {
    let fees = 0;

    if (amount <= 30000) {
        const units1 = Math.ceil(amount / 100);
        fees = units1 * 0.09;
    } else if (amount <= 60000) {
        const units1 = Math.ceil(30000 / 100);
        const units2 = Math.ceil((amount - 30000) / 100);
        fees = units1 * 0.09 + units2 * 0.072;
    } else {
        const units1 = Math.ceil(30000 / 100);
        const units2 = Math.ceil(30000 / 100);
        const units3 = Math.ceil((amount - 60000) / 100);
        fees = units1 * 0.09 + units2 * 0.072 + units3 * 0.06;
    }

    return Math.round(fees * 100) / 100;
}

function calculateConveyancingFees(amount) {
    const GST_RATE = 0.09;
    const base = calculateConveyancingBase(amount);
    const withGst = base * (1 + GST_RATE);
    return Math.ceil(withGst);
}

function getOptionFee(flatType) {
    if (flatType === '2rm') return 500;
    if (flatType === '3rm') return 1000;
    return 2000;
}

function getSurveyFees(flatType) {
    const fees = {
        '2rm': 163.50,
        '3rm': 231.60,
        '4rm': 299.75,
        '5rm': 354.25,
        '3gen': 354.25
    };
    return fees[flatType] || 0;
}

function getFireInsurance(flatType) {
    const insurance = {
        '3rm': 3.27,
        '4rm': 4.59,
        '5rm': 5.43,
        '3gen': 5.43
    };
    return insurance[flatType] || 0;
}

function getOARate(age) {
    if (age <= 35) return 0.23;
    if (age <= 45) return 0.21;
    if (age <= 50) return 0.19;
    if (age <= 55) return 0.15;
    if (age <= 60) return 0.12;
    return 0;
}

let currentMonthlyInstallment = 0;
let currentIncomeMode = 'msr';

function formatOAPercent(age) {
    const a = parseInt(age) || 0;
    const rate = getOARate(a);
    if (!a) return null;
    if (!rate) return 'N/A';
    return (rate * 100).toFixed(1).replace('.0', '');
}

function updateCpfSwitchLabel() {
    const right = document.getElementById('incomeModeLabelRight');
    if (!right) return;
    const age = document.getElementById('age') ? document.getElementById('age').value : '';
    const pct = formatOAPercent(age);
    if (!pct) {
        right.textContent = 'CPF OA Contributions';
    } else if (pct === 'N/A') {
        right.textContent = 'CPF OA Contributions (N/A)';
    } else {
        right.textContent = `CPF OA Contributions (${pct}%)`;
    }
}

function updateMinIncomeDisplay(mode) {
    const ageInput = document.getElementById('age');
    const age = parseInt(ageInput.value) || 0;
    const display = document.getElementById('minIncomeDisplay');
    const label = document.getElementById('minIncomeLabel');
    const tooltipContent = document.getElementById('minIncomeTooltipContent');
    const working = document.getElementById('calculationWorking');
    
    if (!display || !currentMonthlyInstallment) return;

    currentIncomeMode = mode || 'msr';
    const installmentStr = '$' + currentMonthlyInstallment.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const tooltipLines = tooltipContent ? tooltipContent.querySelectorAll('.tooltip-line') : null;
    const line0 = tooltipLines && tooltipLines.length ? tooltipLines[0] : null;
    const line1 = tooltipLines && tooltipLines.length > 1 ? tooltipLines[1] : null;

    if (mode === 'msr') {
        display.style.color = '';
        const income = currentMonthlyInstallment / 0.30;
        display.textContent = '$' + income.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        label.textContent = 'Min. Gross Monthly Income (MSR 30%)';
        if (line0) line0.textContent = 'MSR method: assumes monthly instalment is 30% of gross income.';
        if (line1) line1.textContent = 'For joint tenancy, this refers to the total combined income needed.';
        if (working) working.textContent = `Calculation: ${installmentStr} / 30% (MSR)`;
    } else if (mode === 'cpf') {
        updateCpfSwitchLabel();
        if (!age) {
            display.style.color = '';
            display.textContent = 'Please enter age';
            if (line0) line0.textContent = 'Enter age above to estimate CPF OA coverage.';
            if (line1) line1.textContent = '';
            if (working) working.textContent = '';
            return;
        }
        
        const rate = getOARate(age);
        if (rate === 0) {
             display.style.color = '';
             display.textContent = 'N/A (Age > 60)';
             if (line0) line0.textContent = 'CPF OA estimates are not shown for age above 60.';
             if (line1) line1.textContent = 'CPF usage limits and rules may differ by case.';
             if (working) working.textContent = '';
             return;
        }

        const requiredIncome = currentMonthlyInstallment / rate;
        const maxOA = 8000 * rate;
        
        display.textContent = '$' + requiredIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
        
        const ratePercent = (rate * 100).toFixed(1).replace('.0', '');
        if (working) working.textContent = `Calculation: ${installmentStr} / ${ratePercent}% (OA Contribution)`;

        if (currentMonthlyInstallment > maxOA) {
            display.style.color = '#dc3545';
            if (line0) line0.textContent = '⚠️ Exceeds the CPF salary ceiling for one person ($8,000 wage).';
            if (line1) line1.textContent = 'For joint owners, the combined ceiling is higher ($16,000) and may cover it.';
        } else {
            display.style.color = '';
            if (line0) line0.textContent = `CPF method: uses OA allocation rate of ${ratePercent}% (age ${age}).`;
            if (line1) line1.textContent = 'Assumes Ordinary Wages only (excludes bonuses / Additional Wages).';
        }
        
        label.textContent = 'Min. Gross Income (Full CPF Coverage)';
    }
}

function calculate() {
    const unitPrice = parseFloat(document.getElementById('unitPrice').value);
    const flatType = document.getElementById('flatType').value;
    const loanType = document.getElementById('loanType').value;
    const scheme = document.getElementById('scheme').value;
    const age = parseInt(document.getElementById('age').value) || 0;

    if (!unitPrice || !flatType || !loanType) {
        alert('Please fill in all required fields (Unit Price, Flat Type, Loan Type)');
        return;
    }

    const results = document.getElementById('results');
    results.style.display = 'block';
    
    let html = '';

    const optionFee = getOptionFee(flatType);
    html += `
        <div class="result-section">
            <h3>First Appointment (Flat Selection)</h3>
            <div class="breakdown">
                <div class="breakdown-item">
                    <span>Option Fee (via NETS)</span>
                    <span>$${optionFee.toLocaleString()}</span>
                </div>
                <div class="breakdown-item total">
                    <span>Total Due</span>
                    <span>$${optionFee.toLocaleString()}</span>
                </div>
            </div>
        </div>
    `;

    let secondApptTotal = 0;
    let secondApptBreakdown = [];

    if (scheme === 'deferred') {
        const downpayment = unitPrice * 0.025;
        const downpaymentLabel = loanType === 'bank'
            ? 'Downpayment (2.5% <span class="min-income-wrap" style="display:inline-flex;align-items:center;gap:2px;cursor:pointer;"><span class="tooltip-icon">&#9432;</span><span class="tooltip-content"><span class="tooltip-line">Assumes 2.5% in cash here.</span></span></span>)'
            : 'Downpayment (2.5%)';
        secondApptBreakdown.push([downpaymentLabel, downpayment]);
        secondApptBreakdown.push(['Less: Option Fee paid', -optionFee]);
        secondApptTotal += downpayment - optionFee;

        const bsd = calculateBSD(unitPrice);
        secondApptBreakdown.push(['Buyer Stamp Duty', bsd]);
        secondApptTotal += bsd;

        const conveyancingSale = calculateConveyancingFees(unitPrice);
        secondApptBreakdown.push(['HDB Conveyancing Fees (Sale)', conveyancingSale]);
        secondApptTotal += conveyancingSale;
    } else {
        if (loanType === 'no-loan') {
            const downpayment = unitPrice * 0.10;
            secondApptBreakdown.push(['Downpayment (10%)', downpayment]);
            secondApptBreakdown.push(['Less: Option Fee paid', -optionFee]);
            secondApptTotal += downpayment - optionFee;
        } else if (loanType === 'hdb') {
            let downpaymentPercent = 0.10;
            if (scheme === 'staggered') downpaymentPercent = 0.05;

            const downpayment = unitPrice * downpaymentPercent;
            secondApptBreakdown.push([`Downpayment (${downpaymentPercent * 100}%)`, downpayment]);
            secondApptBreakdown.push(['Less: Option Fee paid', -optionFee]);
            secondApptTotal += downpayment - optionFee;
        } else if (loanType === 'bank') {
            let downpaymentPercent = 0.20;
            let cashBreakdown = '5% cash + 15% cash/CPF';

            if (scheme === 'staggered') {
                downpaymentPercent = 0.10;
                cashBreakdown = '5% cash + 5% cash/CPF';
            }

            const downpayment = unitPrice * downpaymentPercent;
            const downLabel = `Downpayment (${downpaymentPercent * 100}% <span class="min-income-wrap" style="display:inline-flex;align-items:center;gap:2px;cursor:pointer;"><span class="tooltip-icon">&#9432;</span><span class="tooltip-content"><span class="tooltip-line">Assumes ${cashBreakdown} here.</span></span></span>)`;
            secondApptBreakdown.push([downLabel, downpayment]);
            secondApptBreakdown.push(['Less: Option Fee paid', -optionFee]);
            secondApptTotal += downpayment - optionFee;
        }

        const bsd = calculateBSD(unitPrice);
        secondApptBreakdown.push(['Buyer Stamp Duty', bsd]);
        secondApptTotal += bsd;

        if (loanType === 'bank') {
            const saleConveyancing = calculateConveyancingFees(unitPrice);
            const loanAmountForFees = unitPrice * 0.75;
            const mortgageConveyancing = calculateConveyancingFees(loanAmountForFees);
            const totalConveyancing = saleConveyancing + mortgageConveyancing;

            secondApptBreakdown.push(['HDB Conveyancing Fees (Sale)', saleConveyancing]);
            secondApptBreakdown.push(['HDB Conveyancing Fees (Mortgage)', mortgageConveyancing]);
            secondApptBreakdown.push(['Total HDB Conveyancing Fees', totalConveyancing]);
            secondApptTotal += totalConveyancing;
        } else {
            const conveyancing = calculateConveyancingFees(unitPrice);
            const label = loanType === 'hdb'
                ? 'HDB Conveyancing Fees (Sale + HDB Mortgage)'
                : 'HDB Conveyancing Fees (Sale)';
            secondApptBreakdown.push([label, conveyancing]);
            secondApptTotal += conveyancing;
        }

        if (loanType === 'bank') {
            secondApptBreakdown.push(['Lawyer Legal Fees (estimate)', '2,500 - 3,000', true]);
        }
    }

    let secondApptTotalMin = secondApptTotal;
    let secondApptTotalMax = secondApptTotal;
    if (loanType === 'bank' && scheme !== 'deferred') {
        secondApptTotalMin += 2500;
        secondApptTotalMax += 3000;
    }

    html += `
        <div class="result-section">
            <h3>Second Appointment (Signing of Lease Agreement)</h3>
            <p class="info-text">Estimated 6-9 months from First Appointment</p>
            <div class="breakdown">
    `;

    secondApptBreakdown.forEach(item => {
        if (item[2]) {
            html += `<div class="breakdown-item"><span>${item[0]}</span><span>${item[1]}</span></div>`;
        } else {
            html += `<div class="breakdown-item"><span>${item[0]}</span><span>$${typeof item[1] === 'number' ? item[1].toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : item[1]}</span></div>`;
        }
    });

    html += `
                <div class="breakdown-item total">
                    <span>Total Due</span>
                    <span>$${(loanType === 'bank' && scheme !== 'deferred')
                        ? secondApptTotalMin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' - $' + secondApptTotalMax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                        : secondApptTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                    }</span>
                </div>
            </div>
        </div>
    `;

    let thirdApptTotal = 0;
    let thirdApptBreakdown = [];
    
    if (loanType === 'no-loan') {
        const secondApptDownPercent = scheme === 'deferred' ? 0.025 : 0.10;
        const paymentPercent = 1 - secondApptDownPercent;
        const payment = unitPrice * paymentPercent;
        thirdApptBreakdown.push([`Balance Payment (${paymentPercent * 100}%)`, payment]);
        thirdApptTotal += payment;
    } else if (loanType === 'hdb') {
        let paymentPercent = 0.15;
        if (scheme === 'staggered') paymentPercent = 0.20;
        if (scheme === 'deferred') paymentPercent = 0.225;
        
        const payment = unitPrice * paymentPercent;
        thirdApptBreakdown.push([`Balance Payment (${paymentPercent * 100}%)`, payment]);
        thirdApptTotal += payment;
        
        thirdApptBreakdown.push(['Lease In-Escrow Registration Fees', 38.30]);
        thirdApptBreakdown.push(['Mortgage In-Escrow Registration Fees', 38.30]);
        thirdApptBreakdown.push(['Mortgage Stamp Duty', 500.00]);
        thirdApptTotal += 38.30 + 38.30 + 500.00;
    } else if (loanType === 'bank') {
        let paymentPercent = 0.05;
        
        if (scheme === 'staggered') {
            paymentPercent = 0.15;
        } else if (scheme === 'deferred') {
            paymentPercent = 0.225;
        }
        
        const payment = unitPrice * paymentPercent;
        let balanceLabel;
        if (scheme === 'deferred') {
            balanceLabel = 'Balance Payment (22.5% <span class="min-income-wrap" style="display:inline-flex;align-items:center;gap:2px;cursor:pointer;"><span class="tooltip-icon">&#9432;</span><span class="tooltip-content"><span class="tooltip-line">Assumes 2.5% cash paid previously, so 2.5% cash + 20% cash/CPF here.</span></span></span>)';
        } else {
            balanceLabel = `Balance Payment (${paymentPercent * 100}%)`;
        }
        thirdApptBreakdown.push([balanceLabel, payment]);
        thirdApptTotal += payment;
        
        thirdApptBreakdown.push(['Mortgage In-Escrow Registration Fees', 38.30]);
        thirdApptBreakdown.push(['Mortgage Stamp Duty', 500.00]);
        thirdApptTotal += 38.30 + 500.00;
    }

    const surveyFees = getSurveyFees(flatType);
    const fireInsurance = getFireInsurance(flatType);
    
    thirdApptBreakdown.push(['Survey Fees', surveyFees]);
    thirdApptTotal += surveyFees;
    
    if (fireInsurance > 0) {
        thirdApptBreakdown.push(['Fire Insurance for 5 years', fireInsurance]);
        thirdApptTotal += fireInsurance;
    }

    if (loanType === 'bank') {
        thirdApptBreakdown.push(['SP Water/Electricity Activation', 'Variable', true]);
    }

    html += `
        <div class="result-section">
            <h3>Third Appointment (Key Collection)</h3>
            <div class="breakdown">
    `;

    thirdApptBreakdown.forEach(item => {
        if (item[2]) {
            html += `<div class="breakdown-item"><span>${item[0]}</span><span>${item[1]}</span></div>`;
        } else {
            html += `<div class="breakdown-item"><span>${item[0]}</span><span>$${typeof item[1] === 'number' ? item[1].toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : item[1]}</span></div>`;
        }
    });

    html += `
                <div class="breakdown-item total">
                    <span>Total Due</span>
                    <span>$${thirdApptTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
            </div>
        </div>
    `;

    let totalCash = null;
    let totalCashMin = null;
    let totalCashMax = null;

    if (loanType === 'bank' && scheme !== 'deferred') {
        totalCashMin = optionFee + secondApptTotalMin + thirdApptTotal;
        totalCashMax = optionFee + secondApptTotalMax + thirdApptTotal;
    } else {
        totalCash = optionFee + secondApptTotal + thirdApptTotal;
    }

    html += `
        <div class="result-section">
            <h3>Total Cash Required</h3>
            <div class="breakdown">
                <div class="breakdown-item">
                    <span>First Appointment</span>
                    <span>$${optionFee.toLocaleString()}</span>
                </div>
                <div class="breakdown-item">
                    <span>Second Appointment</span>
                    <span>$${(loanType === 'bank' && scheme !== 'deferred')
                        ? secondApptTotalMin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' - $' + secondApptTotalMax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                        : secondApptTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                    }</span>
                </div>
                <div class="breakdown-item">
                    <span>Third Appointment</span>
                    <span>$${thirdApptTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div class="breakdown-item total">
                    <span>Total</span>
                    <span>$${(loanType === 'bank' && scheme !== 'deferred')
                        ? totalCashMin.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' - $' + totalCashMax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                        : totalCash.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
                    }</span>
                </div>
            </div>
        </div>
    `;

    if (loanType === 'hdb' || loanType === 'bank') {
        const loanAmount = unitPrice * 0.75;
        const interestRate = loanType === 'hdb' ? 0.026 : 0.016;
        const loanTenureYears = 25;
        const monthlyRate = interestRate / 12;
        const numPayments = loanTenureYears * 12;
        
        const monthlyInstallment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
        
        currentMonthlyInstallment = monthlyInstallment;
        
        const minMonthlyIncome = monthlyInstallment / 0.30;
        
        const incomeMode = currentIncomeMode || 'msr';
        const rateDisplay = loanType === 'hdb' ? '2.6%' : '1.6%';
        const rateDisclaimerText = loanType === 'bank' ? 'Note: Bank loan interest rates are floating and subject to change. The rate used here (1.6%) is an estimate.' : '';
        const tooltipLines = [
            'MSR method: assumes monthly instalment is 30% of gross income.',
            'For joint tenancy, this refers to the total combined income needed.'
        ];
        if (rateDisclaimerText) tooltipLines.push(rateDisclaimerText);
        const tooltipHtml = tooltipLines.map(function(t) { return '<span class="tooltip-line">' + t + '</span>'; }).join('');
        
        html += `
            <div class="result-section loan-eligibility">
                <h3>Loan Eligibility Check</h3>
                
                <div style="margin-bottom: 15px; padding: 10px; background: #eee; border-radius: 4px;">
                    <div class="income-mode-controls">
                        <span class="income-mode-label">Calculate Min. Gross Monthly Income with:</span>
                        <div class="income-switch">
                            <span class="switch-label" id="incomeModeLabelLeft">MSR (30%)</span>
                            <label class="switch">
                                <input type="checkbox" id="incomeModeSwitch" ${incomeMode === 'cpf' ? 'checked' : ''} aria-label="Toggle income mode">
                                <span class="slider"></span>
                            </label>
                            <span class="switch-label" id="incomeModeLabelRight">CPF OA Contributions</span>
                        </div>
                    </div>
                </div>

                <div class="breakdown">
                    <div class="breakdown-item">
                        <span>Loan Amount (75% LTV)</span>
                        <span>$${loanAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Interest Rate (${loanTenureYears} years)</span>
                        <span>${rateDisplay}</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Monthly Installment</span>
                        <span>$${monthlyInstallment.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    </div>
                    <div class="breakdown-item" style="border-bottom: none; padding-top: 0; padding-bottom: 5px;">
                        <span id="calculationWorking" style="font-size: 12px; color: #666; font-style: italic;">Calculation: $${monthlyInstallment.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} / 30% (MSR)</span>
                    </div>
                    <div class="breakdown-item total">
                        <span id="minIncomeLabel">Min. Gross Monthly Income (MSR 30%)</span>
                        <span>
                            <span id="minIncomeDisplay">$${minMonthlyIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            <span class="min-income-wrap" id="minIncomeWrap" role="button" tabindex="0" aria-label="Min income details">
                                <span class="tooltip-icon" aria-hidden="true">&#9432;</span>
                                <span class="tooltip-content" id="minIncomeTooltipContent">${tooltipHtml}</span>
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    results.innerHTML = html;

    var shareButton = document.getElementById('shareButton');
    var shareStatus = document.getElementById('shareStatus');
    if (shareButton) shareButton.style.display = 'block';
    if (shareStatus) {
        shareStatus.style.display = 'none';
        shareStatus.textContent = '';
    }

    var incomeModeSwitch = document.getElementById('incomeModeSwitch');
    if (incomeModeSwitch) {
        updateCpfSwitchLabel();
        incomeModeSwitch.addEventListener('change', function() {
            updateMinIncomeDisplay(incomeModeSwitch.checked ? 'cpf' : 'msr');
        });
        updateMinIncomeDisplay(incomeModeSwitch.checked ? 'cpf' : (currentIncomeMode || 'msr'));
    }

    var minIncomeWrap = document.getElementById('minIncomeWrap');
    if (minIncomeWrap) {
        minIncomeWrap.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            minIncomeWrap.classList.toggle('tooltip-open');
        });
        minIncomeWrap.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                minIncomeWrap.classList.toggle('tooltip-open');
            }
        });
    }
    results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.addEventListener('click', function(e) {
    var wrap = document.getElementById('minIncomeWrap');
    if (wrap && !wrap.contains(e.target)) wrap.classList.remove('tooltip-open');
});

document.querySelectorAll('.option-row').forEach(function(row) {
    var inputId = row.getAttribute('data-name');
    if (inputId !== 'age') return;
    row.querySelectorAll('.bubble').forEach(function(bubble) {
        bubble.addEventListener('click', function() {
            updateCpfSwitchLabel();
            if (currentIncomeMode === 'cpf') updateMinIncomeDisplay('cpf');
        });
    });
});

(function setupAgeTooltips() {
    var ageRow = document.querySelector('.option-row[data-name="age"]');
    if (!ageRow) return;

    var supportsHover = false;
    try {
        supportsHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    } catch (e) {
        supportsHover = false;
    }

    var lastSelectedAge = (document.getElementById('age') && document.getElementById('age').value) || null;

    function closeAllAgeTooltips() {
        ageRow.querySelectorAll('.min-income-wrap.show').forEach(function(w) {
            w.classList.remove('show');
        });
    }

    ageRow.querySelectorAll('.bubble').forEach(function(bubble) {
        var wrap = bubble.querySelector('.min-income-wrap');
        if (!wrap) return;

        if (supportsHover) {
            bubble.addEventListener('mouseenter', function() {
                positionTooltip(wrap);
                wrap.classList.add('show');
            });

            bubble.addEventListener('mouseleave', function() {
                wrap.classList.remove('show');
            });
        }

        bubble.addEventListener('click', function() {
            var ageVal = bubble.getAttribute('data-value');

            if (ageVal && lastSelectedAge !== ageVal) {
                lastSelectedAge = ageVal;
                closeAllAgeTooltips();
                return;
            }

            if (wrap.classList.contains('show')) {
                wrap.classList.remove('show');
            } else {
                closeAllAgeTooltips();
                positionTooltip(wrap);
                wrap.classList.add('show');
            }
        });
    });

    document.addEventListener('click', function(e) {
        if (!ageRow.contains(e.target)) closeAllAgeTooltips();
    });
})();

var __shareBusy = false;
var __htmlToImagePromise = null;
var __sharePng = { blob: null, filename: null, url: null };

function normalizeSpaces(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
}

function getSelectedBubbleText(name) {
    var row = document.querySelector('.option-row[data-name="' + name + '"]');
    if (!row) return '';
    var selected = row.querySelector('.bubble.selected');
    if (!selected) return '';
    var clone = selected.cloneNode(true);
    clone.querySelectorAll('.tooltip-content, .tooltip-icon').forEach(function(el) { el.remove(); });
    return normalizeSpaces(clone.textContent);
}

function formatCurrency(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '';
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function ensureHtmlToImageLoaded() {
    if (window.htmlToImage && typeof window.htmlToImage.toBlob === 'function') return Promise.resolve();
    if (__htmlToImagePromise) return __htmlToImagePromise;

    __htmlToImagePromise = new Promise(function(resolve, reject) {
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js';
        script.async = true;
        script.onload = function() { resolve(); };
        script.onerror = function() { reject(new Error('Failed to load image export library. Check your connection and try again.')); };
        document.head.appendChild(script);
    });
    return __htmlToImagePromise;
}

function nextFrame() {
    return new Promise(function(resolve) {
        requestAnimationFrame(function() {
            requestAnimationFrame(resolve);
        });
    });
}

function buildShareCard() {
    var resultsEl = document.getElementById('results');
    if (!resultsEl || resultsEl.style.display === 'none' || !resultsEl.innerHTML.trim()) {
        throw new Error('No results to share yet. Click Calculate first.');
    }

    var unitPrice = parseFloat(document.getElementById('unitPrice').value);
    var flatTypeLabel = getSelectedBubbleText('flatType');
    var schemeLabel = getSelectedBubbleText('scheme');
    var loanTypeLabel = getSelectedBubbleText('loanType');
    var ageLabel = getSelectedBubbleText('age');

    var card = document.createElement('div');
    card.className = 'share-card';
    card.style.position = 'absolute';
    card.style.left = '0';
    card.style.top = '0';
    card.style.pointerEvents = 'none';
    card.style.zIndex = '9998';

    var container = document.querySelector('.container');
    var targetWidth = 900;
    if (container && container.clientWidth) targetWidth = Math.min(900, Math.max(320, container.clientWidth));
    card.style.width = targetWidth + 'px';

    var header = document.createElement('div');
    header.className = 'share-header';
    header.innerHTML = ''
        + '<div class="share-title">HDB BTO Payment Breakdown</div>'
        + '<div class="share-meta">'
        +   '<span><strong>Unit Price:</strong> ' + (formatCurrency(unitPrice) || '—') + '</span>'
        +   '<span><strong>Flat:</strong> ' + (flatTypeLabel || '—') + '</span>'
        +   '<span><strong>Scheme:</strong> ' + (schemeLabel || '—') + '</span>'
        +   '<span><strong>Loan:</strong> ' + (loanTypeLabel || '—') + '</span>'
        +   '<span><strong>Age:</strong> ' + (ageLabel || '—') + '</span>'
        + '</div>';

    var resultsClone = resultsEl.cloneNode(true);
    resultsClone.removeAttribute('id');

    resultsClone.querySelectorAll('.tooltip-open, .show').forEach(function(el) {
        el.classList.remove('tooltip-open');
        el.classList.remove('show');
    });

    var loanSection = resultsClone.querySelector('.result-section.loan-eligibility');
    if (loanSection) {
        var modeSwitch = document.getElementById('incomeModeSwitch');
        var isCpf = !!(modeSwitch && modeSwitch.checked);
        var modeText = isCpf ? 'Calculated using CPF OA Contributions' : 'Calculated using MSR';

        var h3 = loanSection.querySelector('h3');
        if (h3 && !loanSection.querySelector('.loan-subheader')) {
            var sub = document.createElement('div');
            sub.className = 'loan-subheader';
            sub.textContent = modeText;
            if (h3.nextSibling) {
                loanSection.insertBefore(sub, h3.nextSibling);
            } else {
                loanSection.appendChild(sub);
            }
        }

        loanSection.querySelectorAll('div[style]').forEach(function(div) {
            var style = (div.getAttribute('style') || '').replace(/\s+/g, '').toLowerCase();
            if (style.indexOf('background:#eee') !== -1 || style.indexOf('background:#eeeeee') !== -1) {
                if (div.parentNode) div.parentNode.removeChild(div);
            }
        });
    }

    card.appendChild(header);
    card.appendChild(resultsClone);

    var footer = document.createElement('div');
    footer.className = 'share-footer';
    footer.textContent = 'Built by @iluvcarbonara on TG';
    card.appendChild(footer);
    document.body.appendChild(card);

    return card;
}

function setShareModalOpen(open) {
    var overlay = document.getElementById('shareModalOverlay');
    if (!overlay) return;
    overlay.style.display = open ? 'flex' : 'none';
    overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
}

function cleanupSharePng() {
    if (__sharePng.url) {
        try { URL.revokeObjectURL(__sharePng.url); } catch (e) {}
    }
    __sharePng = { blob: null, filename: null, url: null };
}

function showPngPreview(blob, filename) {
    cleanupSharePng();
    __sharePng.blob = blob;
    __sharePng.filename = filename;
    __sharePng.url = URL.createObjectURL(blob);

    var img = document.getElementById('shareModalImage');
    if (img) img.src = __sharePng.url;

    var copyBtn = document.getElementById('shareModalCopy');
    var canCopy = !!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem);
    if (copyBtn) copyBtn.disabled = !canCopy;

    setShareModalOpen(true);
}

async function generateResultsPngBlob() {
    await ensureHtmlToImageLoaded();

    var card = null;
    try {
        card = buildShareCard();

        if (document.fonts && document.fonts.ready) {
            try { await document.fonts.ready; } catch (e) {}
        }
        await nextFrame();

        var pixelRatio = Math.min(3, Math.max(2, (window.devicePixelRatio || 1)));
        var blob = await window.htmlToImage.toBlob(card, {
            backgroundColor: '#ffffff',
            pixelRatio: pixelRatio,
            cacheBust: true
        });
        if (!blob) throw new Error('Failed to generate PNG.');
        return blob;
    } finally {
        if (card && card.parentNode) card.parentNode.removeChild(card);
    }
}

async function shareResultsAsPng() {
    if (__shareBusy) return;
    __shareBusy = true;

    var shareButton = document.getElementById('shareButton');
    var shareStatus = document.getElementById('shareStatus');

    function setStatus(msg) {
        if (!shareStatus) return;
        shareStatus.textContent = msg || '';
        shareStatus.style.display = msg ? 'block' : 'none';
    }

    try {
        if (shareButton) {
            shareButton.disabled = true;
            shareButton.textContent = 'Generating…';
        }
        setStatus('Preparing image…');

        setStatus('Rendering PNG…');

        var blob = await generateResultsPngBlob();
        var unitPrice = parseFloat(document.getElementById('unitPrice').value);
        var dateStr = new Date().toISOString().slice(0, 10);
        var filename = 'bto-breakdown' + (isFinite(unitPrice) ? ('-' + Math.round(unitPrice)) : '') + '-' + dateStr + '.png';

        setStatus('');
        showPngPreview(blob, filename);
    } catch (err) {
        setStatus((err && err.message) ? err.message : 'Failed to share PNG.');
    } finally {
        if (shareButton) {
            shareButton.disabled = false;
            shareButton.textContent = 'Share';
        }
        __shareBusy = false;
    }
}

(function setupShareButton() {
    var btn = document.getElementById('shareButton');
    if (!btn) return;
    btn.addEventListener('click', function() {
        shareResultsAsPng();
    });
})();

(function setupShareModal() {
    var overlay = document.getElementById('shareModalOverlay');
    var closeBtn = document.getElementById('shareModalClose');
    var copyBtn = document.getElementById('shareModalCopy');
    var downloadBtn = document.getElementById('shareModalDownload');

    function close() {
        setShareModalOpen(false);
        setTimeout(function() { cleanupSharePng(); }, 100);
    }

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) close();
        });
    }
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var ov = document.getElementById('shareModalOverlay');
            if (ov && ov.style.display !== 'none') close();
        }
    });

    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            if (!__sharePng.blob) return;
            var a = document.createElement('a');
            a.href = __sharePng.url;
            a.download = __sharePng.filename || 'bto-breakdown.png';
            document.body.appendChild(a);
            a.click();
            a.remove();
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', async function() {
            if (!__sharePng.blob) return;
            if (!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem)) return;

            try {
                copyBtn.disabled = true;
                copyBtn.textContent = 'Copying…';
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': __sharePng.blob })
                ]);
                copyBtn.textContent = 'Copied';
                setTimeout(function() { copyBtn.textContent = 'Copy'; }, 1200);
            } catch (e) {
                copyBtn.textContent = 'Copy failed';
                setTimeout(function() { copyBtn.textContent = 'Copy'; }, 1400);
            } finally {
                copyBtn.disabled = false;
            }
        });
    }
})();

function positionTooltip(wrapEl) {
    var tooltip = wrapEl.querySelector('.tooltip-content');
    if (!tooltip) return;

    tooltip.classList.remove('align-left', 'align-right');
    tooltip.style.left = '';
    tooltip.style.right = '';
    tooltip.style.top = '';
    tooltip.style.bottom = '';
    tooltip.style.transform = '';
    tooltip.style.maxWidth = '';
    tooltip.style.position = '';

    var bubble = wrapEl.closest('.bubble');
    var refEl = bubble || wrapEl;
    var rect = refEl.getBoundingClientRect();
    
    var wasHidden = tooltip.style.display === 'none' || getComputedStyle(tooltip).display === 'none';
    if (wasHidden) {
        tooltip.style.visibility = 'hidden';
        tooltip.style.display = 'block';
    }
    var tooltipWidth = tooltip.offsetWidth || 280;
    var tooltipHeight = tooltip.offsetHeight || 40;
    if (wasHidden) {
        tooltip.style.display = '';
        tooltip.style.visibility = '';
    }

    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;
    var padding = 15;

    var inBreakdown = !!wrapEl.closest('.breakdown-item');
    if (inBreakdown) {
        tooltip.style.position = 'fixed';
        tooltip.style.bottom = 'auto';
        tooltip.style.transform = 'none';
        tooltip.style.maxWidth = 'min(360px, calc(100vw - ' + (padding * 2) + 'px))';

        var wasHidden2 = tooltip.style.display === 'none' || getComputedStyle(tooltip).display === 'none';
        if (wasHidden2) {
            tooltip.style.visibility = 'hidden';
            tooltip.style.display = 'block';
        }
        tooltipWidth = tooltip.offsetWidth || tooltipWidth;
        tooltipHeight = tooltip.offsetHeight || tooltipHeight;
        if (wasHidden2) {
            tooltip.style.display = '';
            tooltip.style.visibility = '';
        }

        var desiredTop = rect.top - tooltipHeight - 10;
        var top = desiredTop;
        if (top < padding) top = rect.bottom + 10;
        if (top + tooltipHeight > viewportHeight - padding) {
            top = Math.max(padding, viewportHeight - padding - tooltipHeight);
        }

        var iconCenterX = rect.left + (rect.width / 2);
        var left = iconCenterX - (tooltipWidth / 2);
        var maxLeft = viewportWidth - padding - tooltipWidth;
        if (left < padding) left = padding;
        if (left > maxLeft) left = Math.max(padding, maxLeft);

        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
        tooltip.style.right = 'auto';
        return;
    }

    var centerX = rect.left + rect.width / 2;
    var tooltipLeft = centerX - tooltipWidth / 2;
    var tooltipRight = centerX + tooltipWidth / 2;

    var overflowsRight = tooltipRight > (viewportWidth - padding);
    var overflowsLeft = tooltipLeft < padding;

    if (overflowsLeft && !overflowsRight) {
        tooltip.classList.add('align-left');
    } else if (overflowsRight && !overflowsLeft) {
        tooltip.classList.add('align-right');
    }
}

document.addEventListener('mouseenter', function(e) {
    var wrap = e.target.closest('.min-income-wrap');
    if (wrap) positionTooltip(wrap);
}, true);

document.addEventListener('click', function(e) {
    var wrap = e.target.closest('.min-income-wrap');
    if (wrap) positionTooltip(wrap);
}, true);

(function trackBreakdownTooltip() {
    var activeWrap = null;
    var rafId = 0;

    function isWrapTooltipVisible(wrap) {
        if (!wrap) return false;
        var tip = wrap.querySelector('.tooltip-content');
        if (!tip) return false;
        var cs = getComputedStyle(tip);
        return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
    }

    function schedule() {
        if (rafId) return;
        rafId = requestAnimationFrame(function() {
            rafId = 0;
            if (activeWrap && isWrapTooltipVisible(activeWrap)) {
                positionTooltip(activeWrap);
            } else {
                activeWrap = null;
            }
        });
    }

    document.addEventListener('mouseenter', function(e) {
        var wrap = e.target.closest('.min-income-wrap');
        if (!wrap) return;
        if (!wrap.closest('.breakdown-item')) return;
        activeWrap = wrap;
        schedule();
    }, true);

    document.addEventListener('click', function(e) {
        var wrap = e.target.closest('.min-income-wrap');
        if (!wrap) return;
        if (!wrap.closest('.breakdown-item')) return;
        activeWrap = wrap;
        schedule();
    }, true);

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
})();