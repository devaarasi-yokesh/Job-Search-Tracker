class JobSearchTracker {
    constructor() {
        this.applications = JSON.parse(localStorage.getItem('jobApplications')) || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDate();
        this.updateStats();
        this.displayApplications();
        this.checkFollowUps();
        this.showMotivationMessage();
    }

    setupEventListeners() {
        document.getElementById('jobForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addApplication();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.displayApplications();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            document.getElementById('statusFilter').value = 'all';
            this.displayApplications();
        });
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('appliedDate').value = today;
    }

    addApplication() {
        const companyName = document.getElementById('companyName').value.trim();
        const position = document.getElementById('position').value.trim();
        const appliedDate = document.getElementById('appliedDate').value;
        const status = document.getElementById('status').value;

        if (!companyName || !appliedDate) {
            alert('Please fill in all required fields.');
            return;
        }

        const application = {
            id: Date.now(),
            companyName,
            position,
            appliedDate,
            status,
            createdAt: new Date().toISOString()
        };

        this.applications.push(application);
        this.saveToLocalStorage();
        this.updateStats();
        this.displayApplications();
        this.showMotivationMessage();
        this.resetForm();

        // Show success message
        this.showNotification('Application added successfully!', 'success');
    }

    resetForm() {
        document.getElementById('jobForm').reset();
        this.setDefaultDate();
    }

    updateApplicationStatus(id, newStatus) {
        const application = this.applications.find(app => app.id === id);
        if (application) {
            application.status = newStatus;
            this.saveToLocalStorage();
            this.displayApplications();
            this.updateStats();
            
            const statusText = newStatus === 'interview' || newStatus === 'offer' ? 'Congratulations!' : 'Keep going!';
            this.showNotification(`${statusText} Status updated to ${newStatus}.`, 'success');
        }
    }

    deleteApplication(id) {
        if (confirm('Are you sure you want to delete this application?')) {
            this.applications = this.applications.filter(app => app.id !== id);
            this.saveToLocalStorage();
            this.updateStats();
            this.displayApplications();
            this.showMotivationMessage();
            this.showNotification('Application deleted.', 'info');
        }
    }

    updateStats() {
        const totalApplications = this.applications.length;
        const daysActive = this.calculateDaysActive();
        const daysSinceLast = this.calculateDaysSinceLast();

        document.getElementById('totalApplications').textContent = totalApplications;
        document.getElementById('daysActive').textContent = daysActive;
        document.getElementById('daysSinceLast').textContent = daysSinceLast;
    }

    calculateDaysActive() {
        if (this.applications.length === 0) return 0;
        
        const firstApplication = new Date(this.applications[0].createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - firstApplication);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    calculateDaysSinceLast() {
        if (this.applications.length === 0) return 0;
        
        const lastApplication = new Date(this.applications[this.applications.length - 1].createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - lastApplication);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    displayApplications() {
        const applicationsList = document.getElementById('applicationsList');
        const statusFilter = document.getElementById('statusFilter').value;
        
        let filteredApplications = this.applications;
        if (statusFilter !== 'all') {
            filteredApplications = this.applications.filter(app => app.status === statusFilter);
        }

        if (filteredApplications.length === 0) {
            applicationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No applications found. Start by adding your first job application!</p>
                </div>
            `;
            return;
        }

        applicationsList.innerHTML = filteredApplications
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(app => this.createApplicationHTML(app))
            .join('');
    }

    createApplicationHTML(app) {
        const appliedDate = new Date(app.appliedDate).toLocaleDateString();
        const statusClass = app.status === 'interview' || app.status === 'offer' ? 'success' : 
                           app.status === 'rejected' ? 'rejected' : 'applied';

        return `
            <div class="application-item status-${app.status}">
                <div class="application-header">
                    <div class="company-name">${app.companyName}</div>
                    <span class="status-badge ${app.status}">${app.status}</span>
                </div>
                <div class="application-details">
                    ${app.position ? `<div><strong>Position:</strong> ${app.position}</div>` : ''}
                    <div><strong>Applied:</strong> ${appliedDate}</div>
                </div>
                <div class="application-actions">
                    <select onchange="jobTracker.updateApplicationStatus(${app.id}, this.value)" class="btn-small">
                        <option value="applied" ${app.status === 'applied' ? 'selected' : ''}>Applied</option>
                        <option value="interview" ${app.status === 'interview' ? 'selected' : ''}>Interview</option>
                        <option value="offer" ${app.status === 'offer' ? 'selected' : ''}>Offer</option>
                        <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                    <button onclick="jobTracker.deleteApplication(${app.id})" class="btn-small btn-delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    checkFollowUps() {
        const followUpList = document.getElementById('followUpList');
        const followUpSection = document.getElementById('followUpSection');
        
        const applicationsNeedingFollowUp = this.applications.filter(app => {
            if (app.status !== 'applied') return false;
            
            const appliedDate = new Date(app.appliedDate);
            const today = new Date();
            const daysSinceApplied = Math.ceil((today - appliedDate) / (1000 * 60 * 60 * 24));
            
            return daysSinceApplied >= 2 && daysSinceApplied <= 7;
        });

        if (applicationsNeedingFollowUp.length === 0) {
            followUpSection.style.display = 'none';
            return;
        }

        followUpSection.style.display = 'block';
        followUpList.innerHTML = applicationsNeedingFollowUp.map(app => {
            const appliedDate = new Date(app.appliedDate);
            const today = new Date();
            const daysSinceApplied = Math.ceil((today - appliedDate) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="follow-up-item">
                    <div>
                        <div class="company">${app.companyName}</div>
                        <div class="date">Applied ${daysSinceApplied} days ago</div>
                    </div>
                    <div>
                        <i class="fas fa-bell"></i>
                    </div>
                </div>
            `;
        }).join('');
    }

    showMotivationMessage() {
        const motivationContainer = document.getElementById('motivationContainer');
        const totalApplications = this.applications.length;
        const daysSinceLast = this.calculateDaysSinceLast();

        let message = '';
        let messageClass = '';

        if (totalApplications === 0) {
            message = 'Welcome to your job search journey! Start by adding your first application. Every journey begins with a single step! 🚀';
            messageClass = 'encouragement';
        } else if (daysSinceLast === 0) {
            message = `🎉 Great job! You applied today. Keep up the momentum! You've applied to ${totalApplications} job${totalApplications > 1 ? 's' : ''} so far.`;
            messageClass = 'success';
        } else if (daysSinceLast <= 3) {
            message = `You're doing great! You've applied to ${totalApplications} job${totalApplications > 1 ? 's' : ''}. It's okay to take a short break - consider activities like reading, exercising, or networking to stay fresh.`;
            messageClass = 'encouragement';
        } else if (daysSinceLast > 3) {
            message = `It's been ${daysSinceLast} days since your last application. Remember: showing up is better for your growth! Apply for just one job today - that's enough to stay on track. Start slowly to avoid getting derailed from your goal. 💪`;
            messageClass = 'warning';
        }

        if (message) {
            motivationContainer.innerHTML = `
                <div class="motivation-message ${messageClass}">
                    ${message}
                </div>
            `;
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('jobApplications', JSON.stringify(this.applications));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'warning' ? '#856404' : '#0c5460'};
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the application
const jobTracker = new JobSearchTracker();

// Add slideOut animation
const slideOutStyle = document.createElement('style');
slideOutStyle.textContent = `
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(slideOutStyle); 