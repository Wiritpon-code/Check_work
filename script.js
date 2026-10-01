/**
 * Personal To-Do / Task Manager
 * Vanilla JavaScript (No Frameworks, No Backend, LocalStorage persistence)
 */

// ==========================================================================
// Constants & Localization
// ==========================================================================
const STORAGE_KEY = 'my_personal_tasks_data';

const THAI_MONTHS_FULL = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
    'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
    'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTHS_SHORT = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
    'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
    'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_DAYS_FULL = [
    'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'
];

// ==========================================================================
// Application State
// ==========================================================================
let tasks = [];
let today = new Date();
let selectedDateStr = formatDateToISO(today); // 'YYYY-MM-DD'
let calendarYear = today.getFullYear();
let calendarMonth = today.getMonth(); // 0-11
let editingTaskId = null;

// ==========================================================================
// DOM Element References
// ==========================================================================
const headerTodayDateEl = document.getElementById('header-today-date');
const calendarMonthYearEl = document.getElementById('calendar-month-year');
const calendarDaysGridEl = document.getElementById('calendar-days-grid');
const btnPrevMonth = document.getElementById('btn-prev-month');
const btnNextMonth = document.getElementById('btn-next-month');
const btnToday = document.getElementById('btn-today');

const selectedDateHeadingEl = document.getElementById('selected-date-heading');
const selectedDateCountEl = document.getElementById('selected-date-count');
const selectedDateTaskListEl = document.getElementById('selected-date-task-list');

const pendingTasksCountEl = document.getElementById('pending-tasks-count');
const pendingTaskListEl = document.getElementById('pending-task-list');

const summaryTotalEl = document.getElementById('summary-total');
const summaryCompletedEl = document.getElementById('summary-completed');
const summaryPendingEl = document.getElementById('summary-pending');
const summaryOverdueEl = document.getElementById('summary-overdue');

const btnOpenAddModal = document.getElementById('btn-open-add-modal');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const modalTitleEl = document.getElementById('modal-title');
const btnCloseModalX = document.getElementById('btn-close-modal-x');
const btnCancelModal = document.getElementById('btn-cancel-modal');

const taskIdInput = document.getElementById('task-id');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const taskDateInput = document.getElementById('task-date');
const taskTimeInput = document.getElementById('task-time');
const titleErrorEl = document.getElementById('title-error');
const dateErrorEl = document.getElementById('date-error');

// ==========================================================================
// Helper Functions
// ==========================================================================
function formatDateToISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatThaiDateFull(isoString) {
    if (!isoString) return '';
    const parts = isoString.split('-');
    const year = parseInt(parts[0], 10) + 543;
    const month = THAI_MONTHS_FULL[parseInt(parts[1], 10) - 1];
    const day = parseInt(parts[2], 10);
    return `${day} ${month} ${year}`;
}

function formatThaiDateShort(isoString) {
    if (!isoString) return '';
    const parts = isoString.split('-');
    const year = parseInt(parts[0], 10) + 543;
    const month = THAI_MONTHS_SHORT[parseInt(parts[1], 10) - 1];
    const day = parseInt(parts[2], 10);
    return `${day} ${month} ${year}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function isTaskOverdue(task) {
    if (task.completed) return false;
    const todayISO = formatDateToISO(today);
    
    if (task.date < todayISO) {
        return true;
    }
    
    if (task.date === todayISO && task.time) {
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;
        if (task.time < currentTime) {
            return true;
        }
    }
    
    return false;
}

// ==========================================================================
// 9. LocalStorage Management
// ==========================================================================
function loadTasks() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            tasks = JSON.parse(data);
        } catch (e) {
            console.error('Failed to parse tasks from localStorage', e);
            tasks = [];
        }
    } else {
        // Initial sample tasks
        const todayStr = formatDateToISO(today);
        tasks = [
            {
                id: Date.now(),
                title: 'ทำการบ้าน Python',
                description: 'ทำข้อ 1-5 และเตรียมส่งอาจารย์',
                date: todayStr,
                time: '09:00',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 1,
                title: 'ทำรายงาน',
                description: 'สรุปผลการดำเนินงานประจำสัปดาห์',
                date: todayStr,
                time: '13:00',
                completed: true,
                createdAt: new Date().toISOString()
            }
        ];
        saveTasks();
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ==========================================================================
// 1. Header Rendering
// ==========================================================================
function renderHeader() {
    const dayName = THAI_DAYS_FULL[today.getDay()];
    const fullDate = formatThaiDateFull(formatDateToISO(today));
    headerTodayDateEl.textContent = `วัน${dayName}ที่ ${fullDate}`;
}

// ==========================================================================
// 3. Calendar Rendering
// ==========================================================================
function renderCalendar() {
    const buddhistYear = calendarYear + 543;
    const monthName = THAI_MONTHS_FULL[calendarMonth];
    calendarMonthYearEl.textContent = `${monthName} ${buddhistYear}`;

    calendarDaysGridEl.innerHTML = '';

    // First day of month (0: Sunday, 1: Monday, ... 6: Saturday)
    // Convert to Monday as 0: (day + 6) % 7
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const firstDayIndex = (firstDay + 6) % 7;

    const totalDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    // Map of dates with tasks in this month
    const tasksDateSet = new Set(tasks.map(t => t.date));
    const todayISO = formatDateToISO(today);

    // Padding for empty days before month start
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty-day';
        calendarDaysGridEl.appendChild(emptyCell);
    }

    // Days in current month
    for (let day = 1; day <= totalDaysInMonth; day++) {
        const dayButton = document.createElement('button');
        dayButton.type = 'button';
        dayButton.className = 'calendar-day';

        const monthStr = String(calendarMonth + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateISO = `${calendarYear}-${monthStr}-${dayStr}`;

        dayButton.dataset.date = dateISO;
        dayButton.setAttribute('aria-label', `วันที่ ${day} ${monthName}`);

        if (dateISO === todayISO) {
            dayButton.classList.add('today');
        }

        if (dateISO === selectedDateStr) {
            dayButton.classList.add('selected');
        }

        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.textContent = day;
        dayButton.appendChild(dayNumberSpan);

        if (tasksDateSet.has(dateISO)) {
            const dot = document.createElement('span');
            dot.className = 'task-dot';
            dayButton.appendChild(dot);
        }

        dayButton.addEventListener('click', () => {
            selectDate(dateISO);
        });

        calendarDaysGridEl.appendChild(dayButton);
    }
}

function selectDate(dateStr) {
    selectedDateStr = dateStr;
    renderCalendar();
    renderTasks();
}

// ==========================================================================
// 4. Render Tasks for Selected Date
// ==========================================================================
function renderTasks() {
    selectedDateHeadingEl.textContent = `งานวันที่ ${formatThaiDateFull(selectedDateStr)}`;

    const dateTasks = tasks.filter(t => t.date === selectedDateStr);
    selectedDateCountEl.textContent = `${dateTasks.length} งาน`;

    selectedDateTaskListEl.innerHTML = '';

    if (dateTasks.length === 0) {
        selectedDateTaskListEl.innerHTML = `
            <div class="empty-placeholder">
                <p>ไม่มีงานในวันนี้</p>
                <p style="font-size: 12px; margin-top: 4px;">กด "+ เพิ่มงาน" เพื่อเพิ่มงานใหม่</p>
            </div>
        `;
        return;
    }

    dateTasks.forEach(task => {
        const itemEl = createTaskCardElement(task, false);
        selectedDateTaskListEl.appendChild(itemEl);
    });
}

// ==========================================================================
// 5. Render Pending Tasks (งานที่ยังไม่เสร็จ)
// ==========================================================================
function renderPendingTasks() {
    const pendingTasks = tasks.filter(t => !t.completed);

    // Sort by due date (closest first), then time
    pendingTasks.sort((a, b) => {
        if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
        }
        return (a.time || '').localeCompare(b.time || '');
    });

    pendingTasksCountEl.textContent = `${pendingTasks.length} งานค้าง`;
    pendingTaskListEl.innerHTML = '';

    if (pendingTasks.length === 0) {
        pendingTaskListEl.innerHTML = `
            <div class="empty-placeholder">
                <p style="font-size: 16px; font-weight: 600;">ไม่มีงานค้าง 🎉</p>
                <p style="font-size: 12px; margin-top: 4px;">คุณจัดการงานทั้งหมดเรียบร้อยแล้ว</p>
            </div>
        `;
        return;
    }

    pendingTasks.forEach(task => {
        const itemEl = createTaskCardElement(task, true);
        pendingTaskListEl.appendChild(itemEl);
    });
}

// ==========================================================================
// Helper to Create Task Card Element
// ==========================================================================
function createTaskCardElement(task, showDate) {
    const item = document.createElement('div');
    item.className = `task-item ${task.completed ? 'is-completed' : ''}`;
    item.dataset.id = task.id;

    const overdue = isTaskOverdue(task);

    // Status Badge
    let statusBadgeHtml = '';
    if (task.completed) {
        statusBadgeHtml = `<span class="badge badge-completed">เสร็จแล้ว</span>`;
    } else if (overdue) {
        statusBadgeHtml = `<span class="badge badge-overdue">เลยกำหนด</span>`;
    } else {
        statusBadgeHtml = `<span class="badge badge-pending">ยังไม่เสร็จ</span>`;
    }

    // Date & Time text
    let metaText = '';
    if (showDate) {
        metaText += `<span>📅 ${formatThaiDateShort(task.date)}</span>`;
    }
    if (task.time) {
        metaText += `<span>⏰ ${escapeHtml(task.time)}</span>`;
    }

    item.innerHTML = `
        <div class="task-checkbox-wrapper">
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="ทำเครื่องหมายเสร็จแล้ว">
        </div>
        <div class="task-content">
            <div class="task-title">${escapeHtml(task.title)}</div>
            ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-meta">
                ${metaText}
                ${statusBadgeHtml}
            </div>
        </div>
        <div class="task-actions">
            <button type="button" class="btn btn-secondary btn-sm btn-edit" title="แก้ไข">แก้ไข</button>
            <button type="button" class="btn btn-danger btn-sm btn-delete" title="ลบ">ลบ</button>
        </div>
    `;

    // Event Listeners
    const checkbox = item.querySelector('.task-checkbox');
    checkbox.addEventListener('change', () => {
        toggleTask(task.id);
    });

    const btnEdit = item.querySelector('.btn-edit');
    btnEdit.addEventListener('click', () => {
        editTask(task.id);
    });

    const btnDelete = item.querySelector('.btn-delete');
    btnDelete.addEventListener('click', () => {
        deleteTask(task.id);
    });

    return item;
}

// ==========================================================================
// 6. Update Summary (สรุปงาน)
// ==========================================================================
function updateSummary() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t => isTaskOverdue(t)).length;

    summaryTotalEl.textContent = total;
    summaryCompletedEl.textContent = completed;
    summaryPendingEl.textContent = pending;
    summaryOverdueEl.textContent = overdue;
}

// ==========================================================================
// Task Actions: Add, Edit, Delete, Toggle
// ==========================================================================
function addTask(taskData) {
    const newTask = {
        id: Date.now(),
        title: taskData.title,
        description: taskData.description || '',
        date: taskData.date,
        time: taskData.time || '',
        completed: false,
        createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    saveTasks();
    refreshAllViews();
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    openTaskModal(task);
}

function updateTask(taskId, updatedData) {
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) return;

    tasks[index] = {
        ...tasks[index],
        title: updatedData.title,
        description: updatedData.description || '',
        date: updatedData.date,
        time: updatedData.time || ''
    };

    saveTasks();
    refreshAllViews();
}

function deleteTask(taskId) {
    const confirmDelete = window.confirm("ต้องการลบงานนี้หรือไม่?");
    if (!confirmDelete) return;

    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    refreshAllViews();
}

function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks();
    refreshAllViews();
}

function refreshAllViews() {
    renderCalendar();
    renderTasks();
    renderPendingTasks();
    updateSummary();
}

// ==========================================================================
// 2 & 7. Modal Handlers
// ==========================================================================
function openTaskModal(taskToEdit = null) {
    resetModalForm();

    if (taskToEdit) {
        editingTaskId = taskToEdit.id;
        modalTitleEl.textContent = 'แก้ไขงาน';
        taskIdInput.value = taskToEdit.id;
        taskTitleInput.value = taskToEdit.title;
        taskDescInput.value = taskToEdit.description || '';
        taskDateInput.value = taskToEdit.date;
        taskTimeInput.value = taskToEdit.time || '';
    } else {
        editingTaskId = null;
        modalTitleEl.textContent = 'เพิ่มงานใหม่';
        // Default date to currently selected date
        taskDateInput.value = selectedDateStr;
    }

    taskModal.classList.remove('hidden');
    taskTitleInput.focus();
}

function closeTaskModal() {
    taskModal.classList.add('hidden');
    resetModalForm();
}

function resetModalForm() {
    editingTaskId = null;
    taskForm.reset();
    taskIdInput.value = '';
    taskTitleInput.classList.remove('is-invalid');
    taskDateInput.classList.remove('is-invalid');
    titleErrorEl.classList.add('hidden');
    dateErrorEl.classList.add('hidden');
}

// ==========================================================================
// Event Listeners Setup
// ==========================================================================
function initEventListeners() {
    // Open Add Modal
    btnOpenAddModal.addEventListener('click', () => {
        openTaskModal(null);
    });

    // Close Modal
    btnCloseModalX.addEventListener('click', closeTaskModal);
    btnCancelModal.addEventListener('click', closeTaskModal);

    // Close modal on backdrop click
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeTaskModal();
        }
    });

    // Close modal on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !taskModal.classList.contains('hidden')) {
            closeTaskModal();
        }
    });

    // Form Submit
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = taskTitleInput.value.trim();
        const date = taskDateInput.value;
        const description = taskDescInput.value.trim();
        const time = taskTimeInput.value;

        let hasError = false;

        if (!title) {
            taskTitleInput.classList.add('is-invalid');
            titleErrorEl.classList.remove('hidden');
            hasError = true;
        } else {
            taskTitleInput.classList.remove('is-invalid');
            titleErrorEl.classList.add('hidden');
        }

        if (!date) {
            taskDateInput.classList.add('is-invalid');
            dateErrorEl.classList.remove('hidden');
            hasError = true;
        } else {
            taskDateInput.classList.remove('is-invalid');
            dateErrorEl.classList.add('hidden');
        }

        if (hasError) return;

        const taskData = { title, description, date, time };

        if (editingTaskId) {
            updateTask(editingTaskId, taskData);
        } else {
            addTask(taskData);
            // Switch selected date to the newly added task's date to immediately see it
            selectedDateStr = date;
            const taskDateObj = new Date(date);
            calendarYear = taskDateObj.getFullYear();
            calendarMonth = taskDateObj.getMonth();
        }

        closeTaskModal();
    });

    // Clear validation error on typing
    taskTitleInput.addEventListener('input', () => {
        if (taskTitleInput.value.trim()) {
            taskTitleInput.classList.remove('is-invalid');
            titleErrorEl.classList.add('hidden');
        }
    });

    taskDateInput.addEventListener('input', () => {
        if (taskDateInput.value) {
            taskDateInput.classList.remove('is-invalid');
            dateErrorEl.classList.add('hidden');
        }
    });

    // Calendar Navigation
    btnPrevMonth.addEventListener('click', () => {
        calendarMonth--;
        if (calendarMonth < 0) {
            calendarMonth = 11;
            calendarYear--;
        }
        renderCalendar();
    });

    btnNextMonth.addEventListener('click', () => {
        calendarMonth++;
        if (calendarMonth > 11) {
            calendarMonth = 0;
            calendarYear++;
        }
        renderCalendar();
    });

    btnToday.addEventListener('click', () => {
        today = new Date();
        calendarYear = today.getFullYear();
        calendarMonth = today.getMonth();
        selectedDateStr = formatDateToISO(today);
        refreshAllViews();
    });
}

// ==========================================================================
// Initialization
// ==========================================================================
function init() {
    loadTasks();
    renderHeader();
    initEventListeners();
    refreshAllViews();
}

// Run application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
