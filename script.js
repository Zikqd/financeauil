// Главный объект для управления приложением
const SavingsTracker = {
    // Инициализация приложения
    init: function() {
        this.goals = JSON.parse(localStorage.getItem('savingsGoals')) || [];
        this.currentYear = new Date().getFullYear();
        this.currentGoalIndex = null;
        
        this.setupEventListeners();
        this.setupModals();
        this.renderGoals();
        this.updateStats();
        this.setCurrentYear();
        
        // Добавляем примеры целей, если список пуст
        if (this.goals.length === 0) {
            this.addExampleGoals();
        }
    },
    
    // Установка текущего года в футере
    setCurrentYear: function() {
        document.getElementById('currentYear').textContent = this.currentYear;
    },
    
    // Настройка обработчиков событий
    setupEventListeners: function() {
        // Форма добавления цели
        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNewGoal();
        });
    },
    
    // Настройка модальных окон
    setupModals: function() {
        // Модальное окно удаления
        const deleteModal = document.getElementById('deleteModal');
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.deleteGoal();
        });
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                deleteModal.style.display = 'none';
            }
        });
        
        // Модальное окно добавления средств
        const addMoneyModal = document.getElementById('addMoneyModal');
        document.getElementById('confirmAddMoneyBtn').addEventListener('click', () => {
            this.addMoneyToGoal();
        });
        document.getElementById('cancelAddMoneyBtn').addEventListener('click', () => {
            addMoneyModal.style.display = 'none';
        });
        addMoneyModal.addEventListener('click', (e) => {
            if (e.target === addMoneyModal) {
                addMoneyModal.style.display = 'none';
            }
        });
        
        // Модальное окно редактирования цели
        const editGoalModal = document.getElementById('editGoalModal');
        document.getElementById('confirmEditGoalBtn').addEventListener('click', () => {
            this.updateGoal();
        });
        document.getElementById('cancelEditGoalBtn').addEventListener('click', () => {
            editGoalModal.style.display = 'none';
        });
        editGoalModal.addEventListener('click', (e) => {
            if (e.target === editGoalModal) {
                editGoalModal.style.display = 'none';
            }
        });
    },
    
    // Добавление новой цели
    addNewGoal: function() {
        const name = document.getElementById('goalName').value.trim();
        const target = parseFloat(document.getElementById('targetAmount').value);
        const saved = parseFloat(document.getElementById('savedAmount').value);
        const priority = document.getElementById('priority').value;
        
        // Валидация
        if (!name) {
            this.showNotification('Введите название цели!', 'error');
            return;
        }
        
        if (isNaN(target) || target <= 0) {
            this.showNotification('Введите корректную целевую сумму!', 'error');
            return;
        }
        
        if (isNaN(saved) || saved < 0) {
            this.showNotification('Введите корректную сумму накоплений!', 'error');
            return;
        }
        
        if (saved > target) {
            this.showNotification('Накопленная сумма не может превышать целевую!', 'error');
            return;
        }
        
        // Добавление цели
        this.goals.push({
            id: Date.now(), // Уникальный идентификатор
            name,
            target,
            saved,
            priority,
            createdAt: new Date().toISOString()
        });
        
        // Очистка формы
        document.getElementById('goalForm').reset();
        document.getElementById('priority').value = 'medium';
        
        // Обновление интерфейса
        this.renderGoals();
        this.updateStats();
        this.saveGoals();
        this.showNotification(`Цель "${name}" успешно добавлена!`);
    },
    
    // Отображение списка целей
    renderGoals: function() {
        const goalsList = document.getElementById('goalsList');
        const emptyState = document.getElementById('emptyState');
        
        if (this.goals.length === 0) {
            goalsList.innerHTML = '';
            goalsList.appendChild(emptyState);
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Сортируем цели по приоритету
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const sortedGoals = [...this.goals].sort((a, b) => 
            priorityOrder[b.priority] - priorityOrder[a.priority]
        );
        
        // Очищаем список
        goalsList.innerHTML = '';
        
        // Добавляем цели
        sortedGoals.forEach((goal, index) => {
            const percentage = Math.min(Math.round((goal.saved / goal.target) * 100), 100);
            const isCompleted = goal.saved >= goal.target;
            const progressColor = isCompleted ? '#2ecc71' : 
                                 percentage >= 50 ? '#3498db' : 
                                 '#f39c12';
            
            const goalElement = document.createElement('div');
            goalElement.className = `goal-item ${isCompleted ? 'goal-completed' : ''}`;
            goalElement.innerHTML = `
                <div class="goal-header">
                    <div class="goal-title">${goal.name}</div>
                    <div class="goal-amount">${goal.saved.toLocaleString()} ₽ / ${goal.target.toLocaleString()} ₽</div>
                </div>
                
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${percentage}%; background: ${progressColor}">
                        ${percentage}%
                    </div>
                </div>
                
                <div class="goal-info">
                    <div>Приоритет: <span style="color: ${goal.priority === 'high' ? '#e74c3c' : goal.priority === 'medium' ? '#f39c12' : '#3498db'}">
                        ${this.getPriorityText(goal.priority)}
                    </span></div>
                    <div>Осталось: ${(goal.target - goal.saved).toLocaleString()} ₽</div>
                </div>
                
                <div class="actions">
                    <button class="add-btn" data-id="${goal.id}">
                        <i class="fas fa-plus"></i> Добавить
                    </button>
                    <button class="update-btn" data-id="${goal.id}">
                        <i class="fas fa-edit"></i> Редактировать
                    </button>
                    <button class="delete-btn" data-id="${goal.id}">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            `;
            
            goalsList.appendChild(goalElement);
        });
        
        // Добавляем обработчики событий для кнопок
        this.setupGoalButtons();
    },
    
    // Настройка обработчиков кнопок целей
    setupGoalButtons: function() {
        // Кнопка "Добавить"
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const goalId = parseInt(e.currentTarget.getAttribute('data-id'));
                this.openAddMoneyModal(goalId);
            });
        });
        
        // Кнопка "Редактировать"
        document.querySelectorAll('.update-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const goalId = parseInt(e.currentTarget.getAttribute('data-id'));
                this.openEditGoalModal(goalId);
            });
        });
        
        // Кнопка "Удалить"
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const goalId = parseInt(e.currentTarget.getAttribute('data-id'));
                this.openDeleteModal(goalId);
            });
        });
    },
    
    // Открытие модального окна добавления средств
    openAddMoneyModal: function(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;
        
        this.currentGoalIndex = this.goals.findIndex(g => g.id === goalId);
        document.getElementById('addMoneyInput').value = '';
        document.getElementById('addMoneyModal').style.display = 'flex';
    },
    
    // Добавление средств к цели
    addMoneyToGoal: function() {
        if (this.currentGoalIndex === null) return;
        
        const amountInput = document.getElementById('addMoneyInput').value;
        const amount = parseFloat(amountInput);
        
        if (isNaN(amount) || amount <= 0) {
            this.showNotification('Пожалуйста, введите корректную сумму!', 'error');
            return;
        }
        
        this.goals[this.currentGoalIndex].saved += amount;
        
        // Если накопленная сумма превысила целевую, ограничиваем её
        if (this.goals[this.currentGoalIndex].saved > this.goals[this.currentGoalIndex].target) {
            this.goals[this.currentGoalIndex].saved = this.goals[this.currentGoalIndex].target;
        }
        
        // Закрываем модальное окно
        document.getElementById('addMoneyModal').style.display = 'none';
        this.currentGoalIndex = null;
        
        // Обновляем интерфейс
        this.renderGoals();
        this.updateStats();
        this.saveGoals();
        
        this.showNotification(`Добавлено ${amount.toLocaleString()} ₽ к цели "${this.goals[this.currentGoalIndex]?.name || 'цели"!'}`);
    },
    
    // Открытие модального окна редактирования цели
    openEditGoalModal: function(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;
        
        this.currentGoalIndex = this.goals.findIndex(g => g.id === goalId);
        
        // Заполняем форму данными цели
        document.getElementById('editGoalName').value = goal.name;
        document.getElementById('editTargetAmount').value = goal.target;
        document.getElementById('editSavedAmount').value = goal.saved;
        document.getElementById('editPriority').value = goal.priority;
        
        document.getElementById('editGoalModal').style.display = 'flex';
    },
    
    // Обновление цели
    updateGoal: function() {
        if (this.currentGoalIndex === null) return;
        
        const name = document.getElementById('editGoalName').value.trim();
        const target = parseFloat(document.getElementById('editTargetAmount').value);
        const saved = parseFloat(document.getElementById('editSavedAmount').value);
        const priority = document.getElementById('editPriority').value;
        
        // Валидация
        if (!name) {
            this.showNotification('Введите название цели!', 'error');
            return;
        }
        
        if (isNaN(target) || target <= 0) {
            this.showNotification('Введите корректную целевую сумму!', 'error');
            return;
        }
        
        if (isNaN(saved) || saved < 0) {
            this.showNotification('Введите корректную сумму накоплений!', 'error');
            return;
        }
        
        if (saved > target) {
            this.showNotification('Накопленная сумма не может превышать целевую!', 'error');
            return;
        }
        
        // Обновляем цель
        this.goals[this.currentGoalIndex] = {
            ...this.goals[this.currentGoalIndex],
            name,
            target,
            saved,
            priority
        };
        
        // Закрываем модальное окно
        document.getElementById('editGoalModal').style.display = 'none';
        this.currentGoalIndex = null;
        
        // Обновляем интерфейс
        this.renderGoals();
        this.updateStats();
        this.saveGoals();
        
        this.showNotification(`Цель "${name}" обновлена!`);
    },
    
    // Открытие модального окна удаления
    openDeleteModal: function(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;
        
        this.currentGoalIndex = this.goals.findIndex(g => g.id === goalId);
        document.getElementById('deleteModalText').textContent = 
            `Вы уверены, что хотите удалить цель "${goal.name}"?`;
        document.getElementById('deleteModal').style.display = 'flex';
    },
    
    // Удаление цели
    deleteGoal: function() {
        if (this.currentGoalIndex === null) return;
        
        const goalName = this.goals[this.currentGoalIndex].name;
        this.goals.splice(this.currentGoalIndex, 1);
        
        // Закрываем модальное окно
        document.getElementById('deleteModal').style.display = 'none';
        this.currentGoalIndex = null;
        
        // Обновляем интерфейс
        this.renderGoals();
        this.updateStats();
        this.saveGoals();
        
        this.showNotification(`Цель "${goalName}" удалена!`);
    },
    
    // Обновление статистики
    updateStats: function() {
        const totalGoals = this.goals.length;
        const totalSaved = this.goals.reduce((sum, goal) => sum + goal.saved, 0);
        const totalTarget = this.goals.reduce((sum, goal) => sum + goal.target, 0);
        const totalRemaining = totalTarget - totalSaved;
        const completedGoals = this.goals.filter(goal => goal.saved >= goal.target).length;
        
        document.getElementById('totalGoals').textContent = totalGoals;
        document.getElementById('totalSaved').textContent = `${totalSaved.toLocaleString()} ₽`;
        document.getElementById('totalRemaining').textContent = `${totalRemaining.toLocaleString()} ₽`;
        document.getElementById('completedGoals').textContent = completedGoals;
    },
    
    // Получение текста приоритета
    getPriorityText: function(priority) {
        const priorityMap = {
            'low': 'Низкий',
            'medium': 'Средний',
            'high': 'Высокий'
        };
        return priorityMap[priority] || 'Не указан';
    },
    
    // Показать уведомление
    showNotification: function(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `custom-notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    },
    
    // Сохранение целей в localStorage
    saveGoals: function() {
        localStorage.setItem('savingsGoals', JSON.stringify(this.goals));
    },
    
    // Добавление примеров целей
    addExampleGoals: function() {
        const exampleGoals = [
            {
                id: Date.now() + 1,
                name: "Новый ноутбук",
                target: 80000,
                saved: 25000,
                priority: "high",
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 2,
                name: "Отпуск в Крыму",
                target: 60000,
                saved: 15000,
                priority: "medium",
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 3,
                name: "Новый смартфон",
                target: 40000,
                saved: 12000,
                priority: "low",
                createdAt: new Date().toISOString()
            }
        ];
        
        this.goals.push(...exampleGoals);
        this.renderGoals();
        this.updateStats();
        this.saveGoals();
    }
};

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    SavingsTracker.init();
});
