// Основные элементы приложения
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const allTasksBtn = document.getElementById('allTasks');
const activeTasksBtn = document.getElementById('activeTasks');
const completedTasksBtn = document.getElementById('completedTasks');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const notificationBtn = document.getElementById('notificationBtn');
const saveIndicator = document.getElementById('saveIndicator');
const statusIndicator = document.getElementById('status');

// Состояние приложения
let tasks = [];
let currentFilter = 'all';
let notificationsEnabled = false;
let saveTimeout;
let reminderInterval;

// Инициализация приложения
function init() {
  loadTasksFromStorage();
  renderTasks();
  updateOnlineStatus();

  // Проверка доступности уведомлений
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      notificationsEnabled = true;
      notificationBtn.textContent = 'Отключить уведомления';
      startReminderInterval();
    }
  } else {
    notificationBtn.style.display = 'none';
  }

  // Отслеживание онлайн/офлайн статуса
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

// Загрузка задач из локального хранилища
function loadTasksFromStorage() {
  const storedTasks = localStorage.getItem('tasks');
  tasks = storedTasks ? JSON.parse(storedTasks) : [];
}

// Сохранение задач в локальное хранилище
function saveTasksToStorage() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  showSaveIndicator();
}

// Отображение индикатора сохранения
function showSaveIndicator() {
  saveIndicator.classList.add('show');

  // Очищаем предыдущий таймаут, если он есть
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Скрываем индикатор через 2 секунды
  saveTimeout = setTimeout(() => {
    saveIndicator.classList.remove('show');
  }, 2000);
}

// Обновление статуса онлайн/офлайн
function updateOnlineStatus() {
  if (navigator.onLine) {
    statusIndicator.textContent = 'Онлайн';
    statusIndicator.style.color = 'white';
  } else {
    statusIndicator.textContent = 'Офлайн';
    statusIndicator.style.color = '#ffcc00';
  }
}

// Создание новой задачи
function createTask(text) {
  const task = {
    id: Date.now().toString(),
    text,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(task);
  saveTasksToStorage();
  renderTasks();

  if (notificationsEnabled) {
    showNotification('Задача создана', `Новая задача: ${text}`);
  }
}

// Изменение статуса задачи
function toggleTaskStatus(id) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );

  saveTasksToStorage();
  renderTasks();
}

// Удаление задачи
function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasksToStorage();
  renderTasks();
}

// Очистка завершенных задач
function clearCompletedTasks() {
  tasks = tasks.filter(task => !task.completed);
  saveTasksToStorage();
  renderTasks();
}

// Отображение задач в соответствии с текущим фильтром
function renderTasks() {
  taskList.innerHTML = '';

  let filteredTasks = tasks;

  if (currentFilter === 'active') {
    filteredTasks = tasks.filter(task => !task.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(task => task.completed);
  }

  filteredTasks.forEach(task => {
    const taskItem = document.createElement('li');
    taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTaskStatus(task.id));

    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.text;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'task-delete';
    deleteButton.textContent = '✕';
    deleteButton.addEventListener('click', () => deleteTask(task.id));

    taskItem.appendChild(checkbox);
    taskItem.appendChild(taskText);
    taskItem.appendChild(deleteButton);

    taskList.appendChild(taskItem);
  });
}

// Обработка отправки формы
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = taskInput.value.trim();

  if (text) {
    createTask(text);
    taskInput.value = '';
  }
});

// Обработчики кнопок фильтрации
allTasksBtn.addEventListener('click', () => {
  currentFilter = 'all';
  updateFilterButtonsUI();
  renderTasks();
});

activeTasksBtn.addEventListener('click', () => {
  currentFilter = 'active';
  updateFilterButtonsUI();
  renderTasks();
});

completedTasksBtn.addEventListener('click', () => {
  currentFilter = 'completed';
  updateFilterButtonsUI();
  renderTasks();
});

// Обновление UI кнопок фильтрации
function updateFilterButtonsUI() {
  allTasksBtn.classList.toggle('active', currentFilter === 'all');
  activeTasksBtn.classList.toggle('active', currentFilter === 'active');
  completedTasksBtn.classList.toggle('active', currentFilter === 'completed');
}

// Очистка завершенных задач
clearCompletedBtn.addEventListener('click', clearCompletedTasks);

// Работа с уведомлениями
notificationBtn.addEventListener('click', toggleNotifications);

function toggleNotifications() {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    notificationsEnabled = !notificationsEnabled;

    if (notificationsEnabled) {
      notificationBtn.textContent = 'Отключить уведомления';
      startReminderInterval();
    } else {
      notificationBtn.textContent = 'Включить уведомления';
      stopReminderInterval();
    }
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        notificationsEnabled = true;
        notificationBtn.textContent = 'Отключить уведомления';
        showNotification('Уведомления включены', 'Теперь вы будете получать напоминания о задачах');
        startReminderInterval();
      }
    });
  }
}

// Отправка уведомления
function showNotification(title, body) {
  if (notificationsEnabled && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: body,
      icon: 'images/logo192.png'
    });

    notification.onclick = function() {
      window.focus();
      this.close();
    };
  }
}

function startReminderInterval() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
  }

  reminderInterval = setInterval(() => {
    const activeTasks = tasks.filter(task => !task.completed);
    if (activeTasks.length > 0) {
      showNotification('Напоминание о задачах', `У вас ${activeTasks.length} активных задач`);
    }
  }, 2 * 60 * 60 * 1000); // 2 часа
}

function stopReminderInterval() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}

// Запуск приложения
init();