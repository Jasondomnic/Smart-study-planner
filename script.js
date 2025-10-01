        class StudyPlanner {
            constructor() {
                this.tasks = JSON.parse(localStorage.getItem('studyPlannerTasks')) || [];
                this.currentDate = new Date();
                this.currentEditingTask = null;
                
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.renderTasks();
                this.renderCalendar();
                this.updateProgress();
                
                // Set default date to today
                document.getElementById('taskDueDate').value = new Date().toISOString().split('T')[0];
            }

            setupEventListeners() {
                // Navigation tabs
                document.querySelectorAll('.nav-tab').forEach(tab => {
                    tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
                });

                // Task form
                document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));

                // Calendar navigation
                document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
                document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
            }

            switchTab(tabName) {
                // Update nav tabs
                document.querySelectorAll('.nav-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

                // Update sections
                document.querySelectorAll('.section').forEach(section => {
                    section.classList.remove('active');
                });
                document.getElementById(tabName).classList.add('active');

                // Update content if needed
                if (tabName === 'calendar') {
                    this.renderCalendar();
                } else if (tabName === 'progress') {
                    this.updateProgress();
                }
            }

            handleTaskSubmit(e) {
                e.preventDefault();
                
                const formData = {
                    title: document.getElementById('taskTitle').value,
                    dueDate: document.getElementById('taskDueDate').value,
                    priority: document.getElementById('taskPriority').value,
                    category: document.getElementById('taskCategory').value,
                    description: document.getElementById('taskDescription').value,
                };

                if (this.currentEditingTask) {
                    this.updateTask(this.currentEditingTask, formData);
                } else {
                    this.addTask(formData);
                }

                this.resetForm();
            }

            addTask(taskData) {
                const task = {
                    id: Date.now().toString(),
                    ...taskData,
                    completed: false,
                    createdAt: new Date().toISOString()
                };

                this.tasks.push(task);
                this.saveTasks();
                this.renderTasks();
                this.updateProgress();
            }

            updateTask(taskId, taskData) {
                const taskIndex = this.tasks.findIndex(task => task.id === taskId);
                if (taskIndex !== -1) {
                    this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...taskData };
                    this.saveTasks();
                    this.renderTasks();
                    this.updateProgress();
                }
                this.currentEditingTask = null;
            }

            deleteTask(taskId) {
                if (confirm('Are you sure you want to delete this task?')) {
                    this.tasks = this.tasks.filter(task => task.id !== taskId);
                    this.saveTasks();
                    this.renderTasks();
                    this.updateProgress();
                }
            }

            toggleTask(taskId) {
                const task = this.tasks.find(task => task.id === taskId);
                if (task) {
                    task.completed = !task.completed;
                    this.saveTasks();
                    this.renderTasks();
                    this.updateProgress();
                }
            }

            editTask(taskId) {
                const task = this.tasks.find(task => task.id === taskId);
                if (task) {
                    document.getElementById('taskTitle').value = task.title;
                    document.getElementById('taskDueDate').value = task.dueDate;
                    document.getElementById('taskPriority').value = task.priority;
                    document.getElementById('taskCategory').value = task.category;
                    document.getElementById('taskDescription').value = task.description || '';
                    
                    this.currentEditingTask = taskId;
                    
                    // Switch to tasks tab
                    this.switchTab('tasks');
                    
                    // Scroll to form
                    document.getElementById('taskForm').scrollIntoView({ behavior: 'smooth' });
                }
            }

            resetForm() {
                document.getElementById('taskForm').reset();
                document.getElementById('taskDueDate').value = new Date().toISOString().split('T')[0];
                this.currentEditingTask = null;
            }

            renderTasks() {
                const taskList = document.getElementById('taskList');
                
                if (this.tasks.length === 0) {
                    taskList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">No tasks yet! Add your first study task above. 📚✨</p>';
                    return;
                }

                // Sort tasks by due date and completion status
                const sortedTasks = [...this.tasks].sort((a, b) => {
                    if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1;
                    }
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });

                taskList.innerHTML = sortedTasks.map(task => `
                    <div class="task-item ${task.completed ? 'completed' : ''}">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                               onchange="studyPlanner.toggleTask('${task.id}')">
                        <div class="task-content">
                            <div class="task-title">${task.title}</div>
                            <div class="task-meta">
                                <span>📅 ${new Date(task.dueDate).toLocaleDateString()}</span>
                                <span class="priority-badge priority-${task.priority}">
                                    ${task.priority.toUpperCase()}
                                </span>
                                <span>📂 ${task.category}</span>
                            </div>
                            ${task.description ? `<p style="margin-top: 8px; font-size: 0.9rem; color: var(--text-secondary);">${task.description}</p>` : ''}
                        </div>
                        <div class="task-actions">
                            <button class="btn btn-secondary btn-small" onclick="studyPlanner.editTask('${task.id}')">
                                ✏️ Edit
                            </button>
                            <button class="btn btn-danger btn-small" onclick="studyPlanner.deleteTask('${task.id}')">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                `).join('');
            }

            renderCalendar() {
                const calendar = document.getElementById('calendar');
                const currentMonth = document.getElementById('currentMonth');
                
                const year = this.currentDate.getFullYear();
                const month = this.currentDate.getMonth();
                
                currentMonth.textContent = new Date(year, month).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                });

                // Get first day of month and number of days
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const today = new Date();

                // Create calendar header
                const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                let calendarHTML = daysOfWeek.map(day => 
                    `<div class="calendar-header">${day}</div>`
                ).join('');

                // Add empty cells for days before month starts
                for (let i = 0; i < firstDay; i++) {
                    calendarHTML += '<div class="calendar-day"></div>';
                }

                // Add days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                    const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                    
                    const dayTasks = this.tasks.filter(task => task.dueDate === currentDateStr);
                    const hasTasksClass = dayTasks.length > 0 ? 'has-tasks' : '';
                    const todayClass = isToday ? 'today' : '';
                    
                    const tasksHTML = dayTasks.slice(0, 3).map(task => 
                        `<div class="calendar-task" title="${task.title}">${task.title}</div>`
                    ).join('');
                    
                    const moreTasksHTML = dayTasks.length > 3 ? 
                        `<div class="calendar-task">+${dayTasks.length - 3} more</div>` : '';

                    calendarHTML += `
                        <div class="calendar-day ${hasTasksClass} ${todayClass}">
                            <strong>${day}</strong>
                            ${tasksHTML}
                            ${moreTasksHTML}
                        </div>
                    `;
                }

                calendar.innerHTML = calendarHTML;
            }

            changeMonth(direction) {
                this.currentDate.setMonth(this.currentDate.getMonth() + direction);
                this.renderCalendar();
            }

            updateProgress() {
                const totalTasks = this.tasks.length;
                const completedTasks = this.tasks.filter(task => task.completed).length;
                const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                document.getElementById('totalTasks').textContent = totalTasks;
                document.getElementById('completedTasks').textContent = completedTasks;
                document.getElementById('completionRate').textContent = `${completionRate}%`;
                document.getElementById('completionBar').style.width = `${completionRate}%`;

                // Update motivational message
                const messages = {
                    100: "Perfect! You're a study superstar! ✨",
                    80: "Amazing progress! Keep it up! 🌟",
                    60: "Great work! You're doing well! 💖",
                    40: "Good start! Keep going! 🌸",
                    20: "Nice beginning! You can do it! 💪",
                    0: "Ready to start your study journey? 🚀"
                };

                const messageKey = Object.keys(messages).reverse().find(key => completionRate >= parseInt(key));
                document.getElementById('motivationalMessage').textContent = messages[messageKey];

                // Update achievements
                this.updateAchievements(completedTasks);
            }

            updateAchievements(completedTasks) {
                const achievements = document.getElementById('achievements');
                let achievementHTML = '';

                const milestones = [
                    { count: 1, title: "First Step!", icon: "🌱", desc: "Completed your first task" },
                    { count: 5, title: "Getting Started!", icon: "🌸", desc: "5 tasks completed" },
                    { count: 10, title: "Study Warrior!", icon: "⚔️", desc: "10 tasks completed" },
                    { count: 20, title: "Academic Hero!", icon: "🏆", desc: "20 tasks completed" },
                    { count: 50, title: "Study Master!", icon: "👑", desc: "50 tasks completed" }
                ];

                const earnedAchievements = milestones.filter(milestone => completedTasks >= milestone.count);
                
                if (earnedAchievements.length === 0) {
                    achievementHTML = '<p>Complete your first task to unlock achievements! 💖</p>';
                } else {
                    achievementHTML = earnedAchievements.map(achievement => `
                        <div style="display: inline-block; margin: 10px; padding: 15px; background: var(--secondary); border-radius: 15px; text-align: center;">
                            <div style="font-size: 2rem;">${achievement.icon}</div>
                            <div style="font-weight: bold; margin: 5px 0;">${achievement.title}</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">${achievement.desc}</div>
                        </div>
                    `).join('');
                }

                achievements.innerHTML = achievementHTML;
            }

            saveTasks() {
                localStorage.setItem('studyPlannerTasks', JSON.stringify(this.tasks));
            }
        }

        // Initialize the app
        const studyPlanner = new StudyPlanner();
