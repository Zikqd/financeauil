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
        this.renderGoals();
        
        if (this.goals.length === 0) {
            this.addExampleGoals();
        }
    },
    
    // Загрузка целей из localStorage
    loadGoals() {
        const savedGoals = localStorage.getItem('savingsGoals');
        if (savedGoals) {
            try {
                this.goals = JSON.parse(savedGoals);
            } catch (error) {
                console.error('Ошибка загрузки целей:', error);
                this.goals = [];
            }
        }
    },
    
    // Сохранение целей в localStorage
    saveGoals() {
        try {
            localStorage.setItem('savingsGoals', JSON.stringify(this.goals));
        } catch (error) {
            console.error('Ошибка сохранения целей:', error);
        }
    },
    
    // Установка текущего года в футере
    setCurrentYear() {
        const yearElement = document.getElementById('currentYear');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    },
    
    // Настройка обработчиков событий
    setupEventListeners() {
        // Форма добавления цели
        const goalForm = document.getElementById('goalForm');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddGoal();
            });
        }
        
        // Используем делегирование событий для кнопок целей
        const goalsList = document.getElementById('goalsList');
        if (goalsList) {
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
        }
    },
    
    // Настройка модальных окон
    setupModals() {
        // Модальное окно удаления
        const deleteModal = document.getElementById('deleteModal');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.confirmDeleteGoal();
            });
        }
        
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                this.closeModal('deleteModal');
            });
        }
        
        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) {
                    this.closeModal('deleteModal');
                }
            });
        }
        
        // Модальное окно добавления средств
        const addMoneyModal = document.getElementById('addMoneyModal');
        const confirmAddMoneyBtn = document.getElementById('confirmAddMoneyBtn');
        const cancelAddMoneyBtn = document.getElementById('cancelAddMoneyBtn');
        
        if (confirmAddMoneyBtn) {
            confirmAddMoneyBtn.addEventListener('click', () => {
                this.confirmAddMoney();
            });
        }
        
        if (cancelAddMoneyBtn) {
            cancelAddMoneyBtn.addEventListener('click', () => {
                this.closeModal('addMoneyModal');
            });
        }
        
        if (addMoneyModal) {
            addMoneyModal.addEventListener('click', (e) => {
                if (e.target === addMoneyModal) {
                    this.closeModal('addMoneyModal');
                }
            });
        }
        
        // Модальное окно редактирования цели
        const editGoalModal = document.getElementById('editGoalModal');
        const confirmEditGoalBtn = document.getElementById('confirmEditGoalBtn');
        const cancelEditGoalBtn = document.getElementById('cancelEditGoalBtn');
        
        if (confirmEditGoalBtn) {
            confirmEditGoalBtn.addEventListener('click', () => {
                this.confirmEditGoal();
            });
        }
        
        if (cancelEditGoalBtn) {
            cancelEditGoalBtn.addEventListener('click', () => {
                this.closeModal('editGoalModal');
            });
        }
        
        if (editGoalModal) {
            editGoalModal.addEventListener('click', (e) => {
                if (e.target === editGoalModal) {
                    this.closeModal('editGoalModal');
                }
            });
        }
    },
    
    // Закрытие модального окна
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
    },
    
    // Открытие модального окна
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            modal.setAttribute('aria-hidden', 'false');
        }
    },
    
    // Обработка добавления новой цели
    handleAddGoal() {
        const nameInput = document.getElementById('goalName');
        const targetInput = document.getElementById('targetAmount');
        const savedInput = document.getElementById('savedAmount');
        const prioritySelect = document.getElementById('priority');
        
        if (!nameInput || !targetInput || !savedInput || !prioritySelect) return;
        
        const name = nameInput.value.trim();
        const target = parseFloat(targetInput.value);
        const saved = parseFloat(savedInput.value);
        const priority = prioritySelect.value;
        
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
        
        if (!goalsList) return;
        
        if (this.goals.length === 0) {
            if (emptyState) {
                goalsList.innerHTML = '';
                goalsList.appendChild(emptyState);
                emptyState.style.display = 'block';
            }
            return;
        }
        
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
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
                        <div class="goal-title">${this.escapeHtml(goal.name)}</div>
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
                            <i class="fas fa-plus" aria-hidden="true"></i> Добавить
                        </button>
                        <button class="update-btn" data-id="${goal.id}">
                            <i class="fas fa-edit" aria-hidden="true"></i> Редактировать
                        </button>
                        <button class="delete-btn" data-id="${goal.id}">
                            <i class="fas fa-trash" aria-hidden="true"></i> Удалить
                        </button>
                    </div>
                </div>
            `;
        });
        
        goalsList.innerHTML = goalsHTML;
    },
    
    // Экранирование HTML для безопасности
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
        const addMoneyInput = document.getElementById('addMoneyInput');
        if (addMoneyInput) {
            addMoneyInput.value = '';
            addMoneyInput.focus();
        }
        this.openModal('addMoneyModal');
    },
    
    // Подтверждение добавления средств
    confirmAddMoney() {
        if (!this.currentGoalId) return;
        
        const amountInput = document.getElementById('addMoneyInput');
        if (!amountInput) return;
        
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
        this.closeModal('addMoneyModal');
        
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
        const editGoalName = document.getElementById('editGoalName');
        const editTargetAmount = document.getElementById('editTargetAmount');
        const editSavedAmount = document.getElementById('editSavedAmount');
        const editPriority = document.getElementById('editPriority');
        
        if (editGoalName) editGoalName.value = goal.name;
        if (editTargetAmount) editTargetAmount.value = goal.target;
        if (editSavedAmount) editSavedAmount.value = goal.saved;
        if (editPriority) editPriority.value = goal.priority;
        
        this.openModal('editGoalModal');
    },
    
    // Подтверждение редактирования цели
    confirmEditGoal() {
        if (!this.currentGoalId) return;
        
        const name = document.getElementById('editGoalName')?.value.trim();
        const target = parseFloat(document.getElementById('editTargetAmount')?.value);
        const saved = parseFloat(document.getElementById('editSavedAmount')?.value);
        const priority = document.getElementById('editPriority')?.value;
        
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
        this.closeModal('editGoalModal');
        
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
        const deleteModalText = document.getElementById('deleteModalText');
        if (deleteModalText) {
            deleteModalText.textContent = `Вы уверены, что хотите удалить цель "${goal.name}"?`;
        }
        this.openModal('deleteModal');
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
        this.closeModal('deleteModal');
        
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
        
        const totalGoalsElement = document.getElementById('totalGoals');
        const totalSavedElement = document.getElementById('totalSaved');
        const totalRemainingElement = document.getElementById('totalRemaining');
        const completedGoalsElement = document.getElementById('completedGoals');
        
        if (totalGoalsElement) totalGoalsElement.textContent = totalGoals;
        if (totalSavedElement) totalSavedElement.textContent = `${totalSaved.toLocaleString()} ₽`;
        if (totalRemainingElement) totalRemainingElement.textContent = `${totalRemaining.toLocaleString()} ₽`;
        if (completedGoalsElement) completedGoalsElement.textContent = completedGoals;
    },
    
    // Показать уведомление
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `custom-notification ${type}`;
        notification.textContent = message;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        
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
