// Объект для хранения состояния приложения
const SavingsApp = {
    goals: [],
    currentGoalId: null,
    
    // Инициализация приложения
    init() {
        this.loadGoals();
        this.setupEventListeners();
        this.setupModals();
        this.updateStats();
        this.setCurrentYear();
        
        if (this.goals.length === 0) {
            this.addExampleGoals();
        }
    },
    
    // Загрузка целей из localStorage
    loadGoals() {
        const savedGoals = localStorage.getItem('savingsGoals');
        if (savedGoals) {
            this.goals = JSON.parse(savedGoals);
        }
    },
    
    // Сохранение целей в localStorage
    saveGoals() {
        localStorage.setItem('savingsGoals', JSON.stringify(this.goals));
    },
    
    // Установка текущего года в футере
    setCurrentYear() {
        document.getElementById('currentYear').textContent = new Date().getFullYear();
    },
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Форма добавления цели
        const goalForm = document.getElementById('goalForm');
        goalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddGoal();
        });
        
        // Используем делегирование событий для кнопок целей
        const goalsList = document.getElementById('goalsList');
        goalsList.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            
            const goalId = parseInt(button.getAttribute('data-id'));
            if (!goalId) return;
            
            if (button.classList.contains('add-btn')) {
                this.openAddMoneyModal(goalId);
            } else if (button.classList.contains('update-btn')) {
                this.openEditGoalModal(goalId);
            } else if (button.classList.contains('delete-btn')) {
                this.openDeleteModal(goalId);
            }
        });
    },
    
    // Настройка модальных окон
    setupModals() {
        // Модальное окно удаления
        const deleteModal = document.getElementById('deleteModal');
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.confirmDeleteGoal();
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
            this.confirmAddMoney();
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
            this.confirmEditGoal();
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
    
    // Обработка добавления новой цели
    handleAddGoal() {
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
        
        // Создание новой цели
        const newGoal = {
            id: Date.now(),
            name,
            target,
            saved,
            priority,
            createdAt: new Date().toISOString()
        };
        
        // Добавление цели в массив
        this.goals.push(newGoal);
        
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
    renderGoals() {
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
        
        let goalsHTML = '';
        
        sortedGoals.forEach((goal) => {
            const percentage = Math.min(Math.round((goal.saved / goal.target) * 100), 100);
            const isCompleted = goal.saved >= goal.target;
            const progressColor = isCompleted ? '#2ecc71' : 
                                 percentage >= 50 ? '#3498db' : 
                                 '#f39c12';
            
            goalsHTML += `
                <div class="goal-item ${isCompleted ? 'goal-completed' : ''}" data-id="${goal.id}">
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
                </div>
            `;
        });
        
        goalsList.innerHTML = goalsHTML;
    },
    
    // Получение текста приоритета
    getPriorityText(priority) {
        const priorityMap = {
            'low': 'Низкий',
            'medium': 'Средний',
            'high': 'Высокий'
        };
        return priorityMap[priority] || 'Не указан';
    },
    
    // Открытие модального окна добавления средств
    openAddMoneyModal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;
        
        this.currentGoalId = goalId;
        document.getElementById('addMoneyInput').value = '';
        document.getElementById('addMoneyModal').style.display = 'flex';
    },
    
    // Подтверждение добавления средств
    confirmAddMoney() {
        if (!this.currentGoalId) return;
        
        const amountInput = document.getElementById('addMoneyInput');
        const amount = parseFloat(amountInput.value);
        
        if (isNaN(amount) || amount <= 0) {
            this.showNotification('Пожалуйста, введите корректную сумму!', 'error');
            return;
        }
        
        const goalIndex = this.goals.findIndex(g => g.id === this.currentGoalId);
        if (goalIndex === -1) return;
        
        this.goals[goalIndex].saved += amount;
        
        // Если накопленная сумма превысила целевую, ограничиваем её
        if (this.goals[goalIndex].saved > this.goals[goalIndex].target) {
            this.goals[goalIndex].saved = this.goals[goalIndex].target;
        }
        
        // Закрываем модальное окно
        document.getElementById('addMoneyModal').style.display = 'none';
        
        // Обновляем интерфейс
        this.renderGoals();
        this.updateStats();
        this.saveGoals();
        
        this.showNotification(`Добавлено ${amount.toLocaleString()} ₽ к цели "${this.goals[goalIndex].name}"`);
        
        this.currentGoalId = null;
    },
    
    // Открытие модального окна редактирования цели
    openEditGoalModal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;
        
        this.currentGoalId = goalId;
        
        // Заполняем форму данными цели
        document.getElementById('editGoalName').value = goal.name;
        document.getElementById('editTargetAmount').value = goal.target;
        document.getElementById('editSavedAmount').value = goal.saved;
        document.getElementById('editPriority').value = goal.priority;
        
        document.getElementById('editGoalModal').style.display = 'flex';
    },
    
    // Подтверждение редактирования цели
    confirmEditGoal() {
        if (!this.currentGoalId) return;
        
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
        
        const goalIndex = this.goals.findIndex(g => g.id === this.currentGoalId);
        if (goalIndex === -1) return;
        
        // Обновляем цель
        this.goals[goalIndex] = {
            ...this.goals[goalIndex],
            name,
            target,
            saved,
            priority
        };
        
        // Закрываем модальное окно
        document.getElementById('editGoalModal').style.display = 'none';
        
        // Обновляем интерфейс
        this.renderGoals();
        this.updateStats();
        this.saveGoals();
        
        this.showNotification(`Цель "${name}" обновлена!`);
        
        this.currentGoalId = null;
    },
    
    // Открытие модального окна удаления
    openDeleteModal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;
        
        this.currentGoalId = goalId;
        document.getElementById('deleteModalText').textContent = 
            `Вы уверены, что хотите удалить цель "${goal.name}"?`;
        document.getElementById('deleteModal').style.display = 'flex';
    },
    
    // Подтверждение удаления цели
    confirmDeleteGoal() {
        if (!this.currentGoalId) return;
        
        const goalIndex = this.goals.findIndex(g => g.id === this.currentGoalId);
        if (goalIndex === -1) return;
        
        const goalName = this.goals[goalIndex].name;
        
        // Удаляем цель
        this.goals.splice(goalIndex, 1);
        
        // Закрываем модальное окно
        document.getElementById('deleteModal').style.display = 'none';
        
        // Обновляем интерфейс
        this.renderGoals();
        this.updateStats();
        this.saveGoals();
        
        this.showNotification(`Цель "${goalName}" удалена!`);
        
        this.currentGoalId = null;
    },
    
    // Обновление статистики
    updateStats() {
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
    
    // Показать уведомление
    showNotification(message, type = 'success') {
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
    
    // Добавление примеров целей
    addExampleGoals() {
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
    SavingsApp.init();
});
