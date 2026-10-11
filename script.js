/* ========================================
WorkPay — Navigation & Basic Settings
======================================== */

document.addEventListener("DOMContentLoaded", () => {
initNavigation();
initTheme();
initDates();
initWorkStatus();
initWorkSystem();
initPaymentSystem();
initDashboard();
initHistorySystem();
initBackupSystem();
});

/* ----------------------------------------

1. เปลี่ยนหน้าเว็บไซต์
   ---------------------------------------- */

function initNavigation() {
const navButtons = document.querySelectorAll(".nav-btn");
const quickButtons = document.querySelectorAll("[data-go]");

function showPage(pageId) {
const targetPage = document.getElementById(pageId);

if (!targetPage) return;

document.querySelectorAll(".page").forEach(page => {
  page.classList.toggle("active", page.id === pageId);
});

navButtons.forEach(button => {
  button.classList.toggle(
    "active",
    button.dataset.page === pageId
  );
});

window.scrollTo({
  top: 0,
  behavior: "smooth"
});

}

navButtons.forEach(button => {
button.addEventListener("click", () => {
showPage(button.dataset.page);
});
});

quickButtons.forEach(button => {
button.addEventListener("click", () => {
showPage(button.dataset.go);
});
});
}

/* ----------------------------------------
2. เปลี่ยนธีมสว่าง / มืด
---------------------------------------- */

function initTheme() {
const themeToggle = document.getElementById("themeToggle");

if (!themeToggle) return;

let savedTheme = "light";

try {
savedTheme = localStorage.getItem("workpay_theme") || "light";
} catch (error) {
console.warn("ไม่สามารถอ่านการตั้งค่าธีมได้");
}

applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
const nextTheme = document.body.classList.contains("dark")
? "light"
: "dark";

applyTheme(nextTheme);

try {
  localStorage.setItem("workpay_theme", nextTheme);
} catch (error) {
  console.warn("ไม่สามารถบันทึกการตั้งค่าธีมได้");
}

});

function applyTheme(theme) {
const isDark = theme === "dark";

document.body.classList.toggle("dark", isDark);
themeToggle.textContent = isDark ? "☀️" : "🌙";
themeToggle.setAttribute(
  "aria-label",
  isDark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด"
);

}
}

/* ----------------------------------------
3. วันที่ตามเวลาไทย
---------------------------------------- */

function getThailandDate() {
const parts = new Intl.DateTimeFormat("en-CA", {
timeZone: "Asia/Bangkok",
year: "numeric",
month: "2-digit",
day: "2-digit"
}).formatToParts(new Date());

const values = {};

parts.forEach(part => {
if (part.type !== "literal") {
values[part.type] = part.value;
}
});

return `${values.year}-${values.month}-${values.day}`;
}

function getThailandMonth() {
return getThailandDate().slice(0, 7);
}

function initDates() {
const today = getThailandDate();
const month = getThailandMonth();

const workDate = document.getElementById("workDate");
const paymentDate = document.getElementById("paymentDate");
const historyMonth = document.getElementById("historyMonth");
const dashboardMonth = document.getElementById("dashboardMonth");

if (workDate) {
workDate.value = today;
}

if (paymentDate) {
paymentDate.value = today;
paymentDate.max = today;
}

if (historyMonth) {
historyMonth.value = month;
historyMonth.max = month;
}

if (dashboardMonth) {
dashboardMonth.textContent = new Intl.DateTimeFormat("th-TH", {
timeZone: "Asia/Bangkok",
month: "long",
year: "numeric"
}).format(new Date());
}
}

/* ----------------------------------------
4. เลือกสถานะทำงาน / หยุด
---------------------------------------- */

function initWorkStatus() {
const statusInputs = document.querySelectorAll(
'input[name="workStatus"]'
);

const wageField = document.getElementById("wageField");
const dailyWage = document.getElementById("dailyWage");

if (!statusInputs.length || !wageField || !dailyWage) return;

function updateStatus() {
const selected = document.querySelector(
'input[name="workStatus"]:checked'
);

const isWorking = selected && selected.value === "work";

wageField.classList.toggle("hidden", !isWorking);

dailyWage.required = Boolean(isWorking);

if (!isWorking) {
  dailyWage.value = "";
}

}

statusInputs.forEach(input => {
input.addEventListener("change", updateStatus);
});

updateStatus();
}

/* ----------------------------------------
5. ตัวช่วยจัดรูปแบบตัวเลข
---------------------------------------- */

function formatMoney(amount) {
return Number(amount || 0).toLocaleString("th-TH", {
minimumFractionDigits: 2,
maximumFractionDigits: 2
});
}

function formatThaiDate(dateString) {
if (!dateString) return "-";

const parts = dateString.split("-");

if (parts.length !== 3) return dateString;

const date = new Date(
Number(parts[0]),
Number(parts[1]) - 1,
Number(parts[2])
);

return date.toLocaleDateString("th-TH", {
day: "numeric",
month: "short",
year: "numeric"
});
}

/* =========================================================
   6. WORK SYSTEM — ระบบบันทึกวันทำงานและค่าแรง
   ========================================================= */

const WORK_STORAGE_KEY = "workpay_work_records";

let workRecords = [];
let editingWorkId = null;

/* เริ่มต้นระบบ */
function initWorkSystem() {
    const workForm = document.getElementById("workForm");
    const cancelButton = document.getElementById("cancelWorkEdit");

    if (!workForm) return;

    // โหลดข้อมูลที่เคยบันทึกไว้
    loadWorkRecords();

    // แสดงรายการวันทำงาน
    renderWorkRecords();
    updateAvailablePay();

    // บันทึกข้อมูลเมื่อกดปุ่มบันทึก
    workForm.addEventListener("submit", function (event) {
        event.preventDefault();
        saveWorkRecord();
    });

    // ยกเลิกการแก้ไข
    if (cancelButton) {
        cancelButton.addEventListener("click", function () {
            resetWorkForm();
        });
    }
}

/* โหลดข้อมูลจาก localStorage */
function loadWorkRecords() {
    try {
        const savedData = localStorage.getItem(WORK_STORAGE_KEY);
        workRecords = savedData ? JSON.parse(savedData) : [];

        if (!Array.isArray(workRecords)) {
            workRecords = [];
        }
    } catch (error) {
        console.error("ไม่สามารถโหลดข้อมูลวันทำงานได้", error);
        workRecords = [];
    }
}

/* บันทึกข้อมูลลง localStorage */
function persistWorkRecords() {
    try {
        localStorage.setItem(
            WORK_STORAGE_KEY,
            JSON.stringify(workRecords)
        );
        return true;
    } catch (error) {
        console.error("ไม่สามารถบันทึกข้อมูลวันทำงานได้", error);
        showWorkMessage(
            "บันทึกไม่สำเร็จ พื้นที่จัดเก็บข้อมูลอาจเต็ม",
            "error"
        );
        return false;
    }
}

/* บันทึกวันทำงาน */
function saveWorkRecord() {
    const workDate = document.getElementById("workDate");
    const workNote = document.getElementById("workNote");
    const dailyWage = document.getElementById("dailyWage");

    const selectedStatus = document.querySelector(
        'input[name="workStatus"]:checked'
    );

    if (!workDate || !selectedStatus || !workNote || !dailyWage) {
        showWorkMessage("ไม่พบช่องข้อมูลที่จำเป็น", "error");
        return;
    }

    const date = workDate.value;
    const status = selectedStatus.value;
    const note = workNote.value.trim();

    if (!date) {
        showWorkMessage("กรุณาระบุวันที่", "error");
        return;
    }

    if (date > getThailandDate()) {
        showWorkMessage("ไม่สามารถบันทึกวันที่ในอนาคตได้", "error");
        return;
    }

    let wage = 0;

    if (status === "work") {
        wage = Number(dailyWage.value);

        if (
            dailyWage.value.trim() === "" ||
            !Number.isFinite(wage) ||
            wage <= 0
        ) {
            showWorkMessage(
                "กรุณากรอกค่าแรงมากกว่า 0 บาท",
                "error"
            );
            return;
        }
    }

    // ป้องกันการบันทึกซ้ำในวันเดียวกัน
    const duplicate = workRecords.find(record =>
        record.date === date &&
        record.id !== editingWorkId
    );

    if (duplicate) {
        showWorkMessage(
            "วันที่นี้มีรายการแล้ว กรุณาแก้ไขรายการเดิม",
            "error"
        );
        return;
    }

    const oldRecords = [...workRecords];

    if (editingWorkId !== null) {
        // แก้ไขรายการเดิม
        const index = workRecords.findIndex(
            record => record.id === editingWorkId
        );

        if (index === -1) {
            showWorkMessage("ไม่พบรายการที่ต้องการแก้ไข", "error");
            resetWorkForm();
            return;
        }

        workRecords[index] = {
            ...workRecords[index],
            date,
            status,
            wage,
            note,
            updatedAt: new Date().toISOString()
        };
    } else {
        // เพิ่มรายการใหม่
        workRecords.push({
            id: createWorkId(),
            date,
            status,
            wage,
            note,
            createdAt: new Date().toISOString()
        });
    }

    // เรียงวันที่จากใหม่ไปเก่า
    workRecords.sort((a, b) => b.date.localeCompare(a.date));

    if (!persistWorkRecords()) {
        workRecords = oldRecords;
        return;
    }

    showWorkMessage(
        editingWorkId !== null
            ? "แก้ไขข้อมูลเรียบร้อยแล้ว"
            : "บันทึกข้อมูลเรียบร้อยแล้ว",
        "success"
    );

    resetWorkForm();
    renderWorkRecords();
    updateAvailablePay();
    renderDashboard();
    renderHistory();
}

/* สร้าง ID ของรายการ */
function createWorkId() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 9);
}

/* แสดงรายการวันทำงาน */
function renderWorkRecords() {
    const list = document.getElementById("recentWorkList");

    if (!list) return;

    if (workRecords.length === 0) {
        list.innerHTML = `
            <p class="empty-message">
                ยังไม่มีรายการวันทำงาน
            </p>
        `;
        return;
    }

    list.innerHTML = workRecords.map(record => {
        const isWorking = record.status === "work";

        return `
            <div class="record-item">
                <div class="record-info">
                    <strong>${escapeWorkHTML(formatThaiDate(record.date))}</strong>

                    <p>
                        ${isWorking ? "💼 ทำงาน" : "🌿 วันหยุด"}
                    </p>

                    <p>
                        ค่าแรง:
                        ${formatMoney(record.wage)} บาท
                    </p>

                    ${
                        record.note
                            ? `<p>หมายเหตุ: ${escapeWorkHTML(record.note)}</p>`
                            : ""
                    }
                </div>

                <div class="record-actions">
                    <button
                        type="button"
                        class="btn-edit"
                        onclick="editWorkRecord('${record.id}')"
                    >
                        ✏️ แก้ไข
                    </button>

                    <button
                        type="button"
                        class="btn-delete"
                        onclick="deleteWorkRecord('${record.id}')"
                    >
                        🗑️ ลบ
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

/* เปิดรายการเพื่อแก้ไข */
function editWorkRecord(id) {
    const record = workRecords.find(item => item.id === id);

    if (!record) {
        showWorkMessage("ไม่พบรายการที่ต้องการแก้ไข", "error");
        return;
    }

    editingWorkId = id;

    document.getElementById("workDate").value = record.date;
    document.getElementById("workNote").value = record.note || "";
    document.getElementById("dailyWage").value =
        record.status === "work" ? record.wage : "";

    const statusInput = document.querySelector(
        `input[name="workStatus"][value="${record.status}"]`
    );

    if (statusInput) {
        statusInput.checked = true;
        statusInput.dispatchEvent(new Event("change"));
    }

    const submitButton = document.getElementById("workSubmitBtn");
    const cancelButton = document.getElementById("cancelWorkEdit");

    if (submitButton) {
        submitButton.textContent = "บันทึกการแก้ไข";
    }

    if (cancelButton) {
        cancelButton.classList.remove("hidden");
    }

    const form = document.getElementById("workForm");

    if (form) {
        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

/* ลบรายการวันทำงาน */
function deleteWorkRecord(id) {
    const record = workRecords.find(item => item.id === id);

    if (!record) return;

    const confirmed = confirm(
        `ต้องการลบรายการวันที่ ${formatThaiDate(record.date)} ใช่หรือไม่?`
    );

    if (!confirmed) return;

    const oldRecords = [...workRecords];

    workRecords = workRecords.filter(item => item.id !== id);

    if (!persistWorkRecords()) {
        workRecords = oldRecords;
        return;
    }

    if (editingWorkId === id) {
        resetWorkForm();
    }

    renderWorkRecords();
    updateAvailablePay();
    renderDashboard();
    renderHistory();

    showWorkMessage("ลบรายการเรียบร้อยแล้ว", "success");
}

/* คืนค่าแบบฟอร์มหลังบันทึกหรือยกเลิก */
function resetWorkForm() {
    const form = document.getElementById("workForm");

    if (!form) return;

    editingWorkId = null;

    form.reset();

    // ตั้งวันที่กลับเป็นวันนี้ตามเวลาไทย
    document.getElementById("workDate").value = getThailandDate();

    // คืนสถานะเริ่มต้นเป็นทำงาน
    const workRadio = document.querySelector(
        'input[name="workStatus"][value="work"]'
    );

    if (workRadio) {
        workRadio.checked = true;
        workRadio.dispatchEvent(new Event("change"));
    }

    const submitButton = document.getElementById("workSubmitBtn");
    const cancelButton = document.getElementById("cancelWorkEdit");

    if (submitButton) {
        submitButton.textContent = "บันทึกข้อมูล";
    }

    if (cancelButton) {
        cancelButton.classList.add("hidden");
    }
}

/* แสดงข้อความสถานะ */
function showWorkMessage(message, type) {
    const messageBox = document.getElementById("workMessage");

    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.classList.remove("success", "error");
    messageBox.classList.add(type);
}

/* ป้องกันข้อความจากผู้ใช้ทำให้ HTML ผิดรูปแบบ */
function escapeWorkHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

/* =========================================================
   7. PAYMENT SYSTEM — ระบบบันทึกเงินที่ได้รับ
   ========================================================= */

const PAYMENT_STORAGE_KEY = "workpay_payment_records";

let paymentRecords = [];
let editingPaymentId = null;

/* เริ่มต้นระบบ */
function initPaymentSystem() {
    const paymentForm = document.getElementById("paymentForm");
    const cancelButton = document.getElementById("cancelPaymentEdit");

    if (!paymentForm) return;

    loadPaymentRecords();
    renderPaymentRecords();
    updateAvailablePay();

    paymentForm.addEventListener("submit", function (event) {
        event.preventDefault();
        savePaymentRecord();
    });

    if (cancelButton) {
        cancelButton.addEventListener("click", resetPaymentForm);
    }
}

/* โหลดประวัติการรับเงิน */
function loadPaymentRecords() {
    try {
        const savedData = localStorage.getItem(PAYMENT_STORAGE_KEY);
        paymentRecords = savedData ? JSON.parse(savedData) : [];

        if (!Array.isArray(paymentRecords)) {
            paymentRecords = [];
        }
    } catch (error) {
        console.error("โหลดประวัติการรับเงินไม่สำเร็จ", error);
        paymentRecords = [];
    }
}

/* บันทึกประวัติการรับเงิน */
function persistPaymentRecords() {
    try {
        localStorage.setItem(
            PAYMENT_STORAGE_KEY,
            JSON.stringify(paymentRecords)
        );
        return true;
    } catch (error) {
        console.error("บันทึกประวัติการรับเงินไม่สำเร็จ", error);
        showPaymentMessage(
            "บันทึกไม่สำเร็จ พื้นที่จัดเก็บข้อมูลอาจเต็ม",
            "error"
        );
        return false;
    }
}

/* คำนวณรายรับสะสมจากวันทำงาน */
function getTotalEarned() {
    return workRecords.reduce((total, record) => {
        return total + Number(record.wage || 0);
    }, 0);
}

/* คำนวณยอดเงินที่ได้รับทั้งหมด */
function getTotalReceived() {
    return paymentRecords.reduce((total, record) => {
        return total + Number(record.amount || 0);
    }, 0);
}

/* คำนวณยอดค้างจ่าย */
function getOutstandingPay() {
    return Math.max(0, getTotalEarned() - getTotalReceived());
}

/* คำนวณรายได้ของเดือนที่เลือก */
function getMonthlyEarned(month) {
    return workRecords.reduce((total, record) => {
        if (String(record.date || "").slice(0, 7) === month) {
            return total + Number(record.wage || 0);
        }
        return total;
    }, 0);
}

/* คำนวณเงินที่ได้รับของเดือนที่เลือก */
function getMonthlyReceived(month) {
    return paymentRecords.reduce((total, record) => {
        if (String(record.date || "").slice(0, 7) === month) {
            return total + Number(record.amount || 0);
        }
        return total;
    }, 0);
}

/* คำนวณยอดค้างจ่ายของเดือนที่เลือก */
function getMonthlyOutstandingPay(month) {
    return Math.max(
        0,
        getMonthlyEarned(month) - getMonthlyReceived(month)
    );
}

/* บันทึกการรับเงิน */
function savePaymentRecord() {
    const dateInput = document.getElementById("paymentDate");
    const amountInput = document.getElementById("paymentAmount");
    const noteInput = document.getElementById("paymentNote");

    if (!dateInput || !amountInput || !noteInput) {
        showPaymentMessage("ไม่พบช่องข้อมูลที่จำเป็น", "error");
        return;
    }

    const date = dateInput.value;
    const amount = Number(amountInput.value);
    const note = noteInput.value.trim();

    if (!date) {
        showPaymentMessage("กรุณาระบุวันที่รับเงิน", "error");
        return;
    }

    if (date > getThailandDate()) {
        showPaymentMessage("ไม่สามารถบันทึกวันที่ในอนาคตได้", "error");
        return;
    }

    if (
        amountInput.value.trim() === "" ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        showPaymentMessage("กรุณากรอกจำนวนเงินมากกว่า 0 บาท", "error");
        return;
    }

    const oldRecord = editingPaymentId === null
        ? null
        : paymentRecords.find(record => record.id === editingPaymentId);

    if (editingPaymentId !== null && !oldRecord) {
        showPaymentMessage("ไม่พบรายการที่ต้องการแก้ไข", "error");
        resetPaymentForm();
        return;
    }

// คำนวณยอดรับเงินรวม โดยไม่นับรายการเดิมที่กำลังแก้ไข
const receivedWithoutCurrent = getTotalReceived()
    - Number(oldRecord?.amount || 0);

// ตรวจสอบยอดค้างก่อนรับเงินรายการนี้
    const availableBeforeThisPayment = Math.max(
    0,
    getTotalEarned() - receivedWithoutCurrent
    );

    if (amount > availableBeforeThisPayment) {
    showPaymentMessage(
        `ยอดรับเงินเกินยอดค้างจ่าย รับได้สูงสุด ${formatMoney(
            availableBeforeThisPayment
        )} บาท`,
        "error"
    );
    return;
    }

    const oldRecords = [...paymentRecords];

    if (editingPaymentId !== null) {
        const index = paymentRecords.findIndex(
            record => record.id === editingPaymentId
        );

        paymentRecords[index] = {
            ...paymentRecords[index],
            date,
            amount,
            note,
            updatedAt: new Date().toISOString()
        };
    } else {
        paymentRecords.push({
            id: createPaymentId(),
            date,
            amount,
            note,
            createdAt: new Date().toISOString()
        });
    }

    paymentRecords.sort((a, b) => b.date.localeCompare(a.date));

    if (!persistPaymentRecords()) {
        paymentRecords = oldRecords;
        return;
    }

    showPaymentMessage(
        editingPaymentId !== null
            ? "แก้ไขรายการรับเงินเรียบร้อยแล้ว"
            : "บันทึกรายการรับเงินเรียบร้อยแล้ว",
        "success"
    );

    resetPaymentForm();
    renderPaymentRecords();
    updateAvailablePay();
    renderDashboard();
    renderHistory();
}

/* สร้าง ID */
function createPaymentId() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 9);
}

/* แสดงประวัติการรับเงิน */
function renderPaymentRecords() {
    const list = document.getElementById("paymentHistory");

    if (!list) return;

    if (paymentRecords.length === 0) {
        list.innerHTML = `
            <p class="empty-message">
                ยังไม่มีประวัติการรับเงิน
            </p>
        `;
        return;
    }

    list.innerHTML = paymentRecords.map(record => `
        <div class="record-item">
            <div class="record-info">
                <strong>${escapeWorkHTML(formatThaiDate(record.date))}</strong>
                <p>ได้รับเงิน ${formatMoney(record.amount)} บาท</p>
                ${
                    record.note
                        ? `<p>หมายเหตุ: ${escapeWorkHTML(record.note)}</p>`
                        : ""
                }
            </div>

            <div class="record-actions">
                <button
                    type="button"
                    class="btn-edit"
                    onclick="editPaymentRecord('${record.id}')"
                >
                    ✏️ แก้ไข
                </button>

                <button
                    type="button"
                    class="btn-delete"
                    onclick="deletePaymentRecord('${record.id}')"
                >
                    🗑️ ลบ
                </button>
            </div>
        </div>
    `).join("");
}

/* แก้ไขรายการรับเงิน */
function editPaymentRecord(id) {
    const record = paymentRecords.find(item => item.id === id);

    if (!record) {
        showPaymentMessage("ไม่พบรายการที่ต้องการแก้ไข", "error");
        return;
    }

    editingPaymentId = id;

    document.getElementById("paymentDate").value = record.date;
    document.getElementById("paymentAmount").value = record.amount;
    document.getElementById("paymentNote").value = record.note || "";

    const submitButton = document.getElementById("paymentSubmitBtn");
    const cancelButton = document.getElementById("cancelPaymentEdit");

    if (submitButton) {
        submitButton.textContent = "บันทึกการแก้ไข";
    }

    if (cancelButton) {
        cancelButton.classList.remove("hidden");
    }

    document.getElementById("paymentForm").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* ลบรายการรับเงิน */
function deletePaymentRecord(id) {
    const record = paymentRecords.find(item => item.id === id);

    if (!record) return;

    const confirmed = confirm(
        `ต้องการลบประวัติรับเงิน ${formatMoney(record.amount)} บาท ใช่หรือไม่?`
    );

    if (!confirmed) return;

    const oldRecords = [...paymentRecords];

    paymentRecords = paymentRecords.filter(item => item.id !== id);

    if (!persistPaymentRecords()) {
        paymentRecords = oldRecords;
        return;
    }

    if (editingPaymentId === id) {
        resetPaymentForm();
    }

    renderPaymentRecords();
    updateAvailablePay();
    renderDashboard();
    renderHistory();

    showPaymentMessage("ลบประวัติรับเงินเรียบร้อยแล้ว", "success");
}

/* รีเซ็ตแบบฟอร์ม */
function resetPaymentForm() {
    const form = document.getElementById("paymentForm");

    if (!form) return;

    editingPaymentId = null;
    form.reset();

    const paymentDate = document.getElementById("paymentDate");

    if (paymentDate) {
        paymentDate.value = getThailandDate();
        paymentDate.max = getThailandDate();
    }

    const submitButton = document.getElementById("paymentSubmitBtn");
    const cancelButton = document.getElementById("cancelPaymentEdit");

    if (submitButton) {
        submitButton.textContent = "บันทึกการรับเงิน";
    }

    if (cancelButton) {
        cancelButton.classList.add("hidden");
    }
}

/* อัปเดตยอดเงินที่รับได้ */
function updateAvailablePay() {
    const availablePay = document.getElementById("availablePay");

    if (availablePay) {
        availablePay.textContent = `${formatMoney(
            getOutstandingPay()
        )} บาท`;
    }
}

/* แสดงข้อความ */
function showPaymentMessage(message, type) {
    const messageBox = document.getElementById("paymentMessage");

    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.classList.remove("success", "error");
    messageBox.classList.add(type);
}

/* =========================================================
   8. DASHBOARD — สรุปรายรับประจำเดือน
   ========================================================= */

function initDashboard() {
    renderDashboard();
}

/* จัดสรรเงินที่รับให้กับรายได้ โดยหักเดือนเก่าที่สุดก่อน */
function getPaymentAllocation() {
    const monthlyIncome = {};

    // รวมรายได้แยกตามเดือน
    workRecords.forEach(record => {
        if (!record.date || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
            return;
        }

        const month = record.date.slice(0, 7);

        monthlyIncome[month] =
            (monthlyIncome[month] || 0) + Number(record.wage || 0);
    });

    // เรียงเดือนจากเก่าไปใหม่
    const months = Object.keys(monthlyIncome).sort();

    // เตรียมยอดค้างเริ่มต้นของแต่ละเดือน
    const outstandingByMonth = {};

    months.forEach(month => {
        outstandingByMonth[month] = monthlyIncome[month];
    });

    // เรียงรายการรับเงินตามวันที่รับ จากเก่าไปใหม่
    const sortedPayments = [...paymentRecords].sort((a, b) => {
        const dateCompare = String(a.date || "").localeCompare(
            String(b.date || "")
        );

        if (dateCompare !== 0) return dateCompare;

        return String(a.id || "").localeCompare(String(b.id || ""));
    });

    // นำเงินที่รับไปหักยอดค้างของเดือนเก่าที่สุดก่อน
    sortedPayments.forEach(payment => {
        let remaining = Math.max(0, Number(payment.amount || 0));

        for (const month of months) {
            if (remaining <= 0) break;

            const outstanding = outstandingByMonth[month] || 0;
            const allocated = Math.min(remaining, outstanding);

            outstandingByMonth[month] -= allocated;
            remaining -= allocated;
        }
    });

    return outstandingByMonth;
}

/* คำนวณข้อมูลเฉพาะเดือนที่เลือก */
function getMonthlySummary(month) {
    const monthlyWorks = workRecords.filter(record =>
        record.date && record.date.startsWith(month)
    );

    const workDays = monthlyWorks.filter(record =>
        record.status === "work"
    ).length;

    const offDays = monthlyWorks.filter(record =>
        record.status === "off"
    ).length;

    const income = monthlyWorks.reduce((total, record) => {
        return total + Number(record.wage || 0);
    }, 0);

    // คำนวณยอดค้างตามการจัดสรรเงินจากเดือนเก่าสุดก่อน
    const outstandingByMonth = getPaymentAllocation();
    const outstanding = Number(outstandingByMonth[month] || 0);

    // ยอดรับของเดือนนี้ตามวันที่บันทึกรับเงินจริง
    const received = paymentRecords
        .filter(record => record.date && record.date.startsWith(month))
        .reduce((total, record) => {
            return total + Number(record.amount || 0);
        }, 0);

    return {
        workDays,
        offDays,
        income,
        received,
        outstanding
    };
}

/* แสดงผลบน Dashboard */
function renderDashboard() {
    const month = getThailandMonth();
    const summary = getMonthlySummary(month);

    const monthlyIncome = document.getElementById("monthlyIncome");
    const monthlyWorkDays = document.getElementById("monthlyWorkDays");
    const monthlyOffDays = document.getElementById("monthlyOffDays");
    const totalReceived = document.getElementById("totalReceived");
    const outstandingPay = document.getElementById("outstandingPay");
    const dashboardMonth = document.getElementById("dashboardMonth");

    if (monthlyIncome) {
        monthlyIncome.textContent = formatMoney(summary.income);
    }

    if (monthlyWorkDays) {
        monthlyWorkDays.textContent = summary.workDays;
    }

    if (monthlyOffDays) {
        monthlyOffDays.textContent = summary.offDays;
    }

    if (totalReceived) {
        totalReceived.textContent = formatMoney(summary.received);
    }

    if (outstandingPay) {
    outstandingPay.textContent = formatMoney(
        getOutstandingPay()
    );
}

    if (dashboardMonth) {
        dashboardMonth.textContent = new Intl.DateTimeFormat("th-TH", {
            timeZone: "Asia/Bangkok",
            month: "long",
            year: "numeric"
        }).format(new Date());
    }
}

/* =========================================================
   9. HISTORY SYSTEM — ระบบประวัติรายเดือน
   ========================================================= */

function initHistorySystem() {
    const monthInput = document.getElementById("historyMonth");
    const showAllButton = document.getElementById("showAllHistory");

    if (monthInput) {
        monthInput.addEventListener("change", renderHistory);
    }

    if (showAllButton) {
        showAllButton.addEventListener("click", function () {
            if (monthInput) {
                monthInput.value = "";
            }

            renderHistory();
        });
    }

    renderHistory();
}

/* แสดงประวัติของเดือนที่เลือก */
function renderHistory() {
    const monthInput = document.getElementById("historyMonth");
    const selectedMonth = monthInput ? monthInput.value : "";

    const monthlyWorks = workRecords
        .filter(record =>
            !selectedMonth || record.date.startsWith(selectedMonth)
        )
        .sort((a, b) => b.date.localeCompare(a.date));

    const monthlyPayments = paymentRecords
        .filter(record =>
            !selectedMonth || record.date.startsWith(selectedMonth)
        )
        .sort((a, b) => b.date.localeCompare(a.date));

    const workDays = monthlyWorks.filter(
        record => record.status === "work"
    ).length;

    const offDays = monthlyWorks.filter(
        record => record.status === "off"
    ).length;

    const income = monthlyWorks.reduce(
        (total, record) => total + Number(record.wage || 0),
        0
    );

    const received = monthlyPayments.reduce(
        (total, record) => total + Number(record.amount || 0),
        0
    );

    setHistoryText("historyWorkDays", workDays);
    setHistoryText("historyOffDays", offDays);
    setHistoryText("historyIncome", formatMoney(income));
    setHistoryText("historyReceived", formatMoney(received));

const outstandingByMonth = getPaymentAllocation();

const monthlyOutstanding = selectedMonth
    ? Number(outstandingByMonth[selectedMonth] || 0)
    : Object.values(outstandingByMonth).reduce(
        (total, amount) => total + Number(amount || 0),
        0
    );

    setHistoryText(
    "historyOutstanding",
    formatMoney(monthlyOutstanding)
);

    renderHistoryWorkList(monthlyWorks);
    renderHistoryPaymentList(monthlyPayments);
}

/* ตั้งค่าข้อความสรุป */
function setHistoryText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

/* แสดงรายการวันทำงาน */
function renderHistoryWorkList(records) {
    const list = document.getElementById("historyWorkList");

    if (!list) return;

    if (records.length === 0) {
        list.innerHTML = `
            <p class="empty-message">ไม่มีประวัติวันทำงานในช่วงนี้</p>
        `;
        return;
    }

    list.innerHTML = records.map(record => `
        <div class="record-item">
            <div class="record-info">
                <strong>${escapeWorkHTML(formatThaiDate(record.date))}</strong>

                <p>
                    ${record.status === "work" ? "💼 ทำงาน" : "🌿 วันหยุด"}
                </p>

                <p>ค่าแรง: ${formatMoney(record.wage)} บาท</p>

                ${
                    record.note
                        ? `<p>หมายเหตุ: ${escapeWorkHTML(record.note)}</p>`
                        : ""
                }
            </div>

            <div class="record-actions">
                <button
                    type="button"
                    class="btn-edit"
                    onclick="editWorkRecord('${record.id}')"
                >
                    ✏️ แก้ไข
                </button>

                <button
                    type="button"
                    class="btn-delete"
                    onclick="deleteWorkRecord('${record.id}')"
                >
                    🗑️ ลบ
                </button>
            </div>
        </div>
    `).join("");
}

/* แสดงรายการรับเงิน */
function renderHistoryPaymentList(records) {
    const list = document.getElementById("historyPaymentList");

    if (!list) return;

    if (records.length === 0) {
        list.innerHTML = `
            <p class="empty-message">ไม่มีประวัติรับเงินในช่วงนี้</p>
        `;
        return;
    }

    list.innerHTML = records.map(record => `
        <div class="record-item">
            <div class="record-info">
                <strong>${escapeWorkHTML(formatThaiDate(record.date))}</strong>

                <p>ได้รับเงิน ${formatMoney(record.amount)} บาท</p>

                ${
                    record.note
                        ? `<p>หมายเหตุ: ${escapeWorkHTML(record.note)}</p>`
                        : ""
                }
            </div>

            <div class="record-actions">
                <button
                    type="button"
                    class="btn-edit"
                    onclick="editPaymentRecord('${record.id}')"
                >
                    ✏️ แก้ไข
                </button>

                <button
                    type="button"
                    class="btn-delete"
                    onclick="deletePaymentRecord('${record.id}')"
                >
                    🗑️ ลบ
                </button>
            </div>
        </div>
    `).join("");
}

/* =========================================================
   10. BACKUP SYSTEM — สำรองและกู้คืนข้อมูล
   ========================================================= */

function initBackupSystem() {
    const exportButton = document.getElementById("exportBackupBtn");
    const importButton = document.getElementById("importBackupBtn");
    const importFile = document.getElementById("importBackupFile");

    if (exportButton) {
        exportButton.addEventListener("click", exportBackup);
    }

    if (importButton) {
        importButton.addEventListener("click", importBackup);
    }

    if (importFile) {
        importFile.addEventListener("change", function () {
            const message = document.getElementById("backupMessage");

            if (message) {
                message.textContent = importFile.files.length
                    ? "เลือกไฟล์แล้ว พร้อมกู้คืนข้อมูล"
                    : "";
                message.className = "";
            }
        });
    }
}

/* แสดงข้อความสถานะ */
function showBackupMessage(message, type = "") {
    const element = document.getElementById("backupMessage");

    if (!element) return;

    element.textContent = message;
    element.className = type;
}

/* ส่งออกไฟล์สำรอง */
function exportBackup() {
    try {
        // อ่านข้อมูลล่าสุดจาก localStorage
        const savedWorks = localStorage.getItem(WORK_STORAGE_KEY);
        const savedPayments = localStorage.getItem(PAYMENT_STORAGE_KEY);

        const backupData = {
            app: "WorkPay",
            version: 1,
            exportedAt: new Date().toISOString(),
            data: {
                workRecords: savedWorks ? JSON.parse(savedWorks) : [],
                paymentRecords: savedPayments ? JSON.parse(savedPayments) : []
            }
        };

        if (
            !Array.isArray(backupData.data.workRecords) ||
            !Array.isArray(backupData.data.paymentRecords)
        ) {
            throw new Error("รูปแบบข้อมูลในระบบไม่ถูกต้อง");
        }

        const json = JSON.stringify(backupData, null, 2);

        const blob = new Blob(
            [json],
            { type: "application/json;charset=utf-8" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        const date = getThailandDate();

        link.href = url;
        link.download = `WorkPay-Backup-${date}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        showBackupMessage(
            "สำรองข้อมูลสำเร็จแล้ว กรุณาเก็บไฟล์ไว้ในที่ปลอดภัย",
            "success"
        );
    } catch (error) {
        console.error("สำรองข้อมูลไม่สำเร็จ:", error);

        showBackupMessage(
            "สำรองข้อมูลไม่สำเร็จ: " + error.message,
            "error"
        );
    }
}

/* ตรวจสอบรูปแบบข้อมูลก่อนกู้คืน */
function validateBackupData(data) {
    if (!data || typeof data !== "object") {
        throw new Error("ไฟล์ไม่ใช่ข้อมูลสำรอง WorkPay");
    }

    if (data.app !== "WorkPay" || data.version !== 1) {
        throw new Error("ไฟล์นี้ไม่ใช่ไฟล์สำรอง WorkPay เวอร์ชันที่รองรับ");
    }

    if (!data.data || typeof data.data !== "object") {
        throw new Error("ไม่พบส่วนข้อมูลในไฟล์สำรอง");
    }

    const works = data.data.workRecords;
    const payments = data.data.paymentRecords;

    if (!Array.isArray(works) || !Array.isArray(payments)) {
        throw new Error("โครงสร้างข้อมูลในไฟล์ไม่ถูกต้อง");
    }

    const validDate = value =>
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(value + "T00:00:00Z")) &&
        new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;

    const validId = value =>
        typeof value === "string" &&
        value.length > 0 &&
        value.length <= 200;

    const validNote = value =>
        typeof value === "string" &&
        value.length <= 10000;

    for (const record of works) {
        if (
            !record ||
            typeof record !== "object" ||
            !validId(record.id) ||
            !validDate(record.date) ||
            !["work", "off"].includes(record.status) ||
            typeof record.wage !== "number" ||
            !Number.isFinite(record.wage) ||
            record.wage < 0 ||
            (record.status === "off" && record.wage !== 0) ||
            (record.status === "work" && record.wage <= 0) ||
            !validNote(record.note ?? "")
        ) {
            throw new Error("พบรายการวันทำงานที่มีข้อมูลไม่ถูกต้อง");
        }
    }

    for (const record of payments) {
        if (
            !record ||
            typeof record !== "object" ||
            !validId(record.id) ||
            !validDate(record.date) ||
            typeof record.amount !== "number" ||
            !Number.isFinite(record.amount) ||
            record.amount <= 0 ||
            !validNote(record.note ?? "")
        ) {
            throw new Error("พบรายการรับเงินที่มีข้อมูลไม่ถูกต้อง");
        }
    }

    const workIds = works.map(record => record.id);
    const paymentIds = payments.map(record => record.id);

    if (new Set(workIds).size !== workIds.length) {
        throw new Error("ไฟล์มีรหัสรายการวันทำงานซ้ำกัน");
    }

    if (new Set(paymentIds).size !== paymentIds.length) {
        throw new Error("ไฟล์มีรหัสรายการรับเงินซ้ำกัน");
    }

    const workDates = works.map(record => record.date);

    if (new Set(workDates).size !== workDates.length) {
        throw new Error("ไฟล์มีรายการวันทำงานซ้ำวันที่กัน");
    }

    return true;
}

/* นำเข้าและกู้คืนข้อมูล */
async function importBackup() {
    const fileInput = document.getElementById("importBackupFile");
    const file = fileInput?.files?.[0];

    if (!file) {
        showBackupMessage("กรุณาเลือกไฟล์สำรองก่อน", "error");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showBackupMessage("ไฟล์ใหญ่เกินไป (จำกัด 10 MB)", "error");
        return;
    }

    let backupData;

    try {
        const text = await file.text();
        backupData = JSON.parse(text);
        validateBackupData(backupData);
    } catch (error) {
        showBackupMessage(
            "ไม่สามารถใช้ไฟล์นี้ได้: " + error.message,
            "error"
        );
        return;
    }

    const confirmed = confirm(
        "การกู้คืนจะแทนที่ประวัติวันทำงานและประวัติรับเงินทั้งหมดในเบราว์เซอร์นี้\n\n" +
        `วันทำงานในไฟล์: ${backupData.data.workRecords.length} รายการ\n` +
        `ประวัติรับเงินในไฟล์: ${backupData.data.paymentRecords.length} รายการ\n\n` +
        "แนะนำให้ดาวน์โหลดไฟล์สำรองของข้อมูลปัจจุบันก่อนดำเนินการ\n\n" +
        "ต้องการกู้คืนข้อมูลต่อหรือไม่?"
    );

    if (!confirmed) {
        showBackupMessage("ยกเลิกการกู้คืนข้อมูลแล้ว");
        return;
    }

    const oldWorkData = localStorage.getItem(WORK_STORAGE_KEY);
    const oldPaymentData = localStorage.getItem(PAYMENT_STORAGE_KEY);

    try {
        localStorage.setItem(
            WORK_STORAGE_KEY,
            JSON.stringify(backupData.data.workRecords)
        );

        localStorage.setItem(
            PAYMENT_STORAGE_KEY,
            JSON.stringify(backupData.data.paymentRecords)
        );

        // โหลดข้อมูลที่กู้คืนกลับเข้าแอป
        loadWorkRecords();
        loadPaymentRecords();

        // อัปเดตหน้าจอ
        renderWorkRecords();
        renderPaymentRecords();
        updateAvailablePay();
        renderDashboard();
        renderHistory();
        resetWorkForm();
        resetPaymentForm();

        if (fileInput) {
            fileInput.value = "";
        }

        showBackupMessage("กู้คืนข้อมูลสำเร็จแล้ว", "success");
    } catch (error) {
        // หากเกิดข้อผิดพลาด พยายามคืนค่าข้อมูลเดิม
        try {
            if (oldWorkData === null) {
                localStorage.removeItem(WORK_STORAGE_KEY);
            } else {
                localStorage.setItem(WORK_STORAGE_KEY, oldWorkData);
            }

            if (oldPaymentData === null) {
                localStorage.removeItem(PAYMENT_STORAGE_KEY);
            } else {
                localStorage.setItem(PAYMENT_STORAGE_KEY, oldPaymentData);
            }

            loadWorkRecords();
            loadPaymentRecords();
            renderWorkRecords();
            renderPaymentRecords();
            updateAvailablePay();
            renderDashboard();
            renderHistory();
        } catch (rollbackError) {
            console.error("ไม่สามารถคืนค่าข้อมูลเดิมได้", rollbackError);
        }

        console.error("กู้คืนข้อมูลไม่สำเร็จ:", error);

        showBackupMessage(
            "กู้คืนไม่สำเร็จ ระบบพยายามคืนข้อมูลเดิมแล้ว",
            "error"
        );
    }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => {
        console.log("WorkPay PWA พร้อมใช้งาน");
      })
      .catch((error) => {
        console.error("Service Worker Error:", error);
      });
  });
}