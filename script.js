// Ritual Rhythm - Sacred Weekly Planner JavaScript
// Data persistence and interactivity functions

// Global variables
let quotes = [];
const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Habit tracking functionality
function getCompletionHistory() {
    const history = localStorage.getItem('ritual-completion-history');
    return history ? JSON.parse(history) : {};
}

function saveCompletionToHistory(day) {
    const history = getCompletionHistory();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (!history[today]) {
        history[today] = {};
    }
    
    history[today][day] = true;
    localStorage.setItem('ritual-completion-history', JSON.stringify(history));
}

function removeCompletionFromHistory(day) {
    const history = getCompletionHistory();
    const today = new Date().toISOString().split('T')[0];
    
    if (history[today] && history[today][day]) {
        delete history[today][day];
        
        // If no completions for today, remove the date entry
        if (Object.keys(history[today]).length === 0) {
            delete history[today];
        }
        
        localStorage.setItem('ritual-completion-history', JSON.stringify(history));
    }
}

function getCompletionStreak() {
    const history = getCompletionHistory();
    const dates = Object.keys(history).sort().reverse(); // Most recent first
    let streak = 0;
    
    for (const date of dates) {
        const completions = Object.keys(history[date]).length;
        if (completions > 0) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

function getWeeklyCompletionRate() {
    const history = getCompletionHistory();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let totalPossible = 0;
    let totalCompleted = 0;
    
    for (let d = new Date(weekAgo); d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayName = days[d.getDay()];
        
        totalPossible++;
        
        if (history[dateStr] && history[dateStr][dayName]) {
            totalCompleted++;
        }
    }
    
    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
}

function getMonthlyCompletionRate() {
    const history = getCompletionHistory();
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let totalPossible = 0;
    let totalCompleted = 0;
    
    for (let d = new Date(monthAgo); d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayName = days[d.getDay()];
        
        totalPossible++;
        
        if (history[dateStr] && history[dateStr][dayName]) {
            totalCompleted++;
        }
    }
    
    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
}

function generateHabitVisualization() {
    const history = getCompletionHistory();
    const now = new Date();
    const startDate = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000); // Go back 35 days to ensure we get full weeks
    
    // Adjust to start on Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    let visualization = '<div class="grid grid-cols-7 gap-1">';
    
    // Add day headers
    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (const header of dayHeaders) {
        visualization += `<div class="text-center text-xs text-soft-cream/60 font-medium p-1">${header}</div>`;
    }
    
    // Generate calendar grid (show 5 weeks = 35 days)
    const endDate = new Date(startDate.getTime() + 35 * 24 * 60 * 60 * 1000);
    
    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayName = days[d.getDay()];
        const isCompleted = history[dateStr] && history[dateStr][dayName];
        const isToday = dateStr === now.toISOString().split('T')[0];
        const isFuture = d > now;
        
        let className = 'w-5 h-5 rounded-sm border ';
        
        if (isFuture) {
            className += 'bg-quartz/10 border-quartz/20';
        } else if (isCompleted) {
            className += 'bg-mint border-mint shadow-sm';
        } else if (isToday) {
            className += 'bg-amethyst/40 border-amethyst ring-1 ring-amethyst/50';
        } else {
            className += 'bg-quartz/20 border-quartz/30';
        }
        
        visualization += `<div class="${className}" title="${dateStr} - ${dayName}"></div>`;
    }
    
    visualization += '</div>';
    return visualization;
}

// Weekly reset management
function checkWeeklyReset() {
    const now = new Date();
    const today = now.getDay(); // 0 = Sunday
    const lastReset = localStorage.getItem('lastReset');
    
    if (today === 0) { // If it's Sunday
        if (!lastReset) {
            // First time using the app
            performWeeklyReset();
        } else {
            const lastResetDate = new Date(parseInt(lastReset));
            const daysSinceReset = Math.floor((now - lastResetDate) / (1000 * 60 * 60 * 24));
            
            if (daysSinceReset >= 7) {
                performWeeklyReset();
            }
        }
    }
}

function performWeeklyReset() {
    // Clear all journal entries and completions
    days.forEach(day => {
        localStorage.removeItem(`ritual-journal-${day}`);
        localStorage.removeItem(`ritual-journal-${day}-date`);
        localStorage.removeItem(`ritual-complete-${day}`);
        localStorage.removeItem(`ritual-complete-${day}-date`);
    });
    
    // Clear weekly reflection
    localStorage.removeItem('ritual-weekly-reflection');
    
    // Set last reset timestamp
    localStorage.setItem('lastReset', Date.now().toString());
    
    // Show reset banner
    showWeeklyResetBanner();
}

function showWeeklyResetBanner() {
    const banner = document.getElementById('weekly-reset-banner');
    if (banner) {
        banner.classList.remove('hidden');
        banner.style.transform = 'translateY(0)';
        
        // Hide banner after 5 seconds
        setTimeout(() => {
            banner.style.transform = 'translateY(-100%)';
            setTimeout(() => {
                banner.classList.add('hidden');
            }, 500);
        }, 5000);
    }
}

// Journal export functionality - PDF format
function exportJournal(day, content, filename) {
    if (!content || content.trim() === '') {
        showNotification('No journal content to export', 'info');
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set up document styling
        doc.setFontSize(20);
        doc.setTextColor(139, 92, 246); // Amethyst color
        doc.text('Ritual Rhythm', 20, 20);
        
        doc.setFontSize(16);
        doc.setTextColor(251, 191, 36); // Gold color
        doc.text(`${day.charAt(0).toUpperCase() + day.slice(1)} Journal`, 20, 35);
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        const timestamp = new Date().toLocaleDateString();
        doc.text(`Date: ${timestamp}`, 20, 50);
        
        // Add content
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59); // Dark indigo
        
        // Split content into lines that fit the page width
        const lines = doc.splitTextToSize(content, 170);
        doc.text(lines, 20, 70);
        
        // Save the PDF
        const pdfFilename = filename ? filename.replace('.txt', '.pdf') : `${day}-journal.pdf`;
        doc.save(pdfFilename);
        
        showNotification('Journal exported as PDF', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showNotification('Error exporting PDF', 'error');
    }
}

function exportWeeklyReflection() {
    const gratitude = document.getElementById('gratitude-text')?.value || '';
    const proud = document.getElementById('proud-text')?.value || '';
    const release = document.getElementById('release-text')?.value || '';
    
    if (!gratitude && !proud && !release) {
        showNotification('No reflection content to export', 'info');
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set up document styling
        doc.setFontSize(20);
        doc.setTextColor(139, 92, 246); // Amethyst color
        doc.text('Ritual Rhythm', 20, 20);
        
        doc.setFontSize(16);
        doc.setTextColor(251, 191, 36); // Gold color
        doc.text('Weekly Reflection', 20, 35);
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        const timestamp = new Date().toLocaleDateString();
        doc.text(`Date: ${timestamp}`, 20, 50);
        
        let yPosition = 70;
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        
        // Add gratitude section
        if (gratitude) {
            doc.setFontSize(12);
            doc.setTextColor(110, 231, 183); // Mint color
            doc.text('What I\'m grateful for this week:', 20, yPosition);
            yPosition += 10;
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            const gratitudeLines = doc.splitTextToSize(gratitude, 170);
            doc.text(gratitudeLines, 20, yPosition);
            yPosition += (gratitudeLines.length * 5) + 10;
        }
        
        // Add proud section
        if (proud) {
            doc.setFontSize(12);
            doc.setTextColor(110, 231, 183); // Mint color
            doc.text('What I\'m proud of this week:', 20, yPosition);
            yPosition += 10;
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            const proudLines = doc.splitTextToSize(proud, 170);
            doc.text(proudLines, 20, yPosition);
            yPosition += (proudLines.length * 5) + 10;
        }
        
        // Add release section
        if (release) {
            doc.setFontSize(12);
            doc.setTextColor(110, 231, 183); // Mint color
            doc.text('What I release:', 20, yPosition);
            yPosition += 10;
            doc.setFontSize(11);
            doc.setTextColor(30, 41, 59);
            const releaseLines = doc.splitTextToSize(release, 170);
            doc.text(releaseLines, 20, yPosition);
        }
        
        doc.save('weekly-reflection.pdf');
        showNotification('Weekly reflection exported as PDF', 'success');
    } catch (error) {
        console.error('PDF export error:', error);
        showNotification('Error exporting PDF', 'error');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadQuotes();
    
    // Initialize homepage features if we're on the homepage
    if (document.getElementById('habit-visualization')) {
        console.log('Initializing homepage habit tracking...');
        setTimeout(() => {
            updateCompletionBadges();
            updateHabitTracking();
        }, 100);
        
        // Also update when main content becomes visible (after password)
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target.id === 'main-content' && mutation.target.style.display !== 'none') {
                    console.log('Main content visible, updating habit tracking...');
                    setTimeout(() => {
                        updateCompletionBadges();
                        updateHabitTracking();
                    }, 200);
                    observer.disconnect();
                }
            });
        });
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            observer.observe(mainContent, { attributes: true, attributeFilter: ['style'] });
        }
    }
    
    // Initialize reflection page features if we're on the reflection page
    if (document.getElementById('reflection-habit-viz')) {
        setTimeout(() => {
            updateReflectionHabitTracking();
        }, 100);
    }
});

// Load quotes from JSON file
async function loadQuotes() {
    try {
        const response = await fetch('assets/quotes.json');
        quotes = await response.json();
    } catch (error) {
        console.error('Error loading quotes:', error);
        // Fallback quotes if file loading fails
        quotes = [
            { "day": "Sunday", "quote": "You are not starting something new. You are continuing something sacred." },
            { "day": "Monday", "quote": "I am aligned with my highest truth. I am ready for what is mine." },
            { "day": "Tuesday", "quote": "I am divinely resourced. I take inspired action with courage and clarity." },
            { "day": "Wednesday", "quote": "I trust the wisdom within me. I receive divine guidance with an open heart." },
            { "day": "Thursday", "quote": "I embrace growth in all its forms. I am expanding into my fullest potential." },
            { "day": "Friday", "quote": "I am love. I give love freely and receive love abundantly." },
            { "day": "Saturday", "quote": "I honor my need for rest. In stillness, I find my sacred power." }
        ];
    }
}

// Get current day of week (0 = Sunday, 1 = Monday, etc.)
function getCurrentDayIndex() {
    return new Date().getDay();
}

// Get today's quote
function getTodaysQuote() {
    const today = getCurrentDayIndex();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[today];
    
    const todayQuote = quotes.find(q => q.day === todayName);
    return todayQuote || { day: todayName, quote: "Every day is a new opportunity for sacred growth." };
}

// Load and display daily quote on homepage
function loadDailyQuote() {
    const quoteElement = document.getElementById('daily-quote');
    const dayElement = document.getElementById('quote-day');
    
    if (quoteElement && dayElement) {
        const todaysQuote = getTodaysQuote();
        quoteElement.textContent = `"${todaysQuote.quote}"`;
        dayElement.textContent = todaysQuote.day;
    }
}

// Save journal entry to localStorage
function saveJournalEntry(day) {
    const textarea = document.getElementById(`${day}-journal`);
    if (textarea) {
        const entry = textarea.value.trim();
        if (entry) {
            localStorage.setItem(`ritual-journal-${day}`, entry);
            localStorage.setItem(`ritual-journal-${day}-date`, new Date().toISOString());
            
            // Show save confirmation
            showNotification('Journal entry saved', 'success');
        }
    }
}

// Load journal entry from localStorage
function loadJournalEntry(day) {
    const textarea = document.getElementById(`${day}-journal`);
    if (textarea) {
        const savedEntry = localStorage.getItem(`ritual-journal-${day}`);
        if (savedEntry) {
            textarea.value = savedEntry;
        }
    }
}

// Mark day as complete
function markComplete(day) {
    const button = document.getElementById('complete-button');
    const currentDate = new Date().toDateString();
    
    // Check if already completed today
    const lastCompleted = localStorage.getItem(`ritual-complete-${day}-date`);
    
    if (lastCompleted === currentDate) {
        // Unmark as complete
        localStorage.removeItem(`ritual-complete-${day}`);
        localStorage.removeItem(`ritual-complete-${day}-date`);
        removeCompletionFromHistory(day);
        button.textContent = 'Mark Complete';
        button.className = 'w-full bg-rose-clay hover:bg-rose-clay/80 text-soft-cream font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105';
        showNotification('Ritual unmarked', 'info');
    } else {
        // Mark as complete
        localStorage.setItem(`ritual-complete-${day}`, 'true');
        localStorage.setItem(`ritual-complete-${day}-date`, currentDate);
        saveCompletionToHistory(day);
        button.textContent = '✓ Completed Today';
        button.className = 'w-full bg-mint hover:bg-mint/80 text-dark-indigo font-semibold py-3 px-6 rounded-lg transition-all duration-200';
        showNotification('Sacred ritual completed', 'success');
    }
    
    // Update completion badges and habit tracking on homepage if we're there
    updateCompletionBadges();
    updateHabitTracking();
}

// Update completion button state
function updateCompleteButton(day) {
    const button = document.getElementById('complete-button');
    const currentDate = new Date().toDateString();
    const lastCompleted = localStorage.getItem(`ritual-complete-${day}-date`);
    
    if (button) {
        if (lastCompleted === currentDate) {
            button.textContent = '✓ Completed Today';
            button.className = 'w-full bg-mint hover:bg-mint/80 text-dark-indigo font-semibold py-3 px-6 rounded-lg transition-all duration-200';
        } else {
            button.textContent = 'Mark Complete';
            button.className = 'w-full bg-rose-clay hover:bg-rose-clay/80 text-soft-cream font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105';
        }
    }
}

// Update completion badges on homepage
function updateCompletionBadges() {
    const currentDate = new Date().toDateString();
    
    days.forEach(day => {
        const dayButton = document.querySelector(`[data-day="${day}"]`);
        if (dayButton) {
            const badge = dayButton.querySelector('.completion-badge');
            const lastCompleted = localStorage.getItem(`ritual-complete-${day}-date`);
            
            if (badge) {
                if (lastCompleted === currentDate) {
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }
        }
    });
}

// Update habit tracking visualization
function updateHabitTracking() {
    const habitViz = document.getElementById('habit-visualization');
    const streakCount = document.getElementById('streak-count');
    const weeklyRate = document.getElementById('weekly-rate');
    
    if (habitViz) {
        try {
            const vizHTML = generateHabitVisualization();
            habitViz.innerHTML = vizHTML;
            console.log('Habit visualization updated');
        } catch (error) {
            console.error('Error generating habit visualization:', error);
            habitViz.innerHTML = '<div class="text-soft-cream/60 text-xs">Loading...</div>';
        }
    }
    
    if (streakCount) {
        const streak = getCompletionStreak();
        streakCount.textContent = `Streak: ${streak} day${streak !== 1 ? 's' : ''}`;
    }
    
    if (weeklyRate) {
        const rate = getWeeklyCompletionRate();
        weeklyRate.textContent = `This week: ${rate}%`;
    }
}

// Update habit tracking on reflection page
function updateReflectionHabitTracking() {
    const reflectionViz = document.getElementById('reflection-habit-viz');
    const reflectionStreak = document.getElementById('reflection-streak');
    const reflectionMonthly = document.getElementById('reflection-monthly');
    
    if (reflectionViz) {
        reflectionViz.innerHTML = generateHabitVisualization();
    }
    
    if (reflectionStreak) {
        const streak = getCompletionStreak();
        reflectionStreak.textContent = `Streak: ${streak} day${streak !== 1 ? 's' : ''}`;
    }
    
    if (reflectionMonthly) {
        const rate = getMonthlyCompletionRate();
        reflectionMonthly.textContent = `30-day rate: ${rate}%`;
    }
}

// Save weekly reflection
function saveWeeklyReflection() {
    const gratitude = document.getElementById('gratitude-text').value.trim();
    const proud = document.getElementById('proud-text').value.trim();
    const release = document.getElementById('release-text').value.trim();
    
    if (gratitude || proud || release) {
        const reflection = {
            gratitude,
            proud,
            release,
            date: new Date().toISOString()
        };
        
        localStorage.setItem('ritual-weekly-reflection', JSON.stringify(reflection));
        showNotification('Weekly reflection saved', 'success');
    }
}

// Load weekly reflection
function loadWeeklyReflection() {
    const savedReflection = localStorage.getItem('ritual-weekly-reflection');
    
    if (savedReflection) {
        const reflection = JSON.parse(savedReflection);
        const savedDate = new Date(reflection.date);
        const currentDate = new Date();
        const daysDiff = Math.floor((currentDate - savedDate) / (1000 * 60 * 60 * 24));
        
        // Only load if saved within the last 7 days
        if (daysDiff <= 7) {
            document.getElementById('gratitude-text').value = reflection.gratitude || '';
            document.getElementById('proud-text').value = reflection.proud || '';
            document.getElementById('release-text').value = reflection.release || '';
        }
    }
}

// Load week summary for reflection page
function loadWeekSummary() {
    const summaryElement = document.getElementById('week-summary');
    if (!summaryElement) return;
    
    const currentDate = new Date().toDateString();
    let completedCount = 0;
    let totalEntries = 0;
    
    days.forEach(day => {
        const completed = localStorage.getItem(`ritual-complete-${day}-date`) === currentDate;
        const hasEntry = localStorage.getItem(`ritual-journal-${day}`);
        
        if (completed) completedCount++;
        if (hasEntry) totalEntries++;
    });
    
    summaryElement.innerHTML = `
        <div class="flex justify-between items-center mb-2">
            <span>Rituals completed this week:</span>
            <span class="text-mint font-semibold">${completedCount}/7</span>
        </div>
        <div class="flex justify-between items-center">
            <span>Journal entries written:</span>
            <span class="text-gold font-semibold">${totalEntries}/7</span>
        </div>
    `;
}

// Load journal entries for review
function loadJournalEntriesReview() {
    const entriesElement = document.getElementById('journal-entries');
    if (!entriesElement) return;
    
    let entriesHTML = '';
    
    days.forEach(day => {
        const entry = localStorage.getItem(`ritual-journal-${day}`);
        const entryDate = localStorage.getItem(`ritual-journal-${day}-date`);
        
        if (entry) {
            const date = entryDate ? new Date(entryDate).toLocaleDateString() : 'Unknown date';
            const dayName = day.charAt(0).toUpperCase() + day.slice(1);
            
            entriesHTML += `
                <div class="bg-dark-indigo/50 border border-quartz/50 rounded-lg p-3">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="text-amethyst font-medium text-sm">${dayName}</h4>
                        <span class="text-soft-cream/60 text-xs">${date}</span>
                    </div>
                    <p class="text-soft-cream/80 text-xs leading-relaxed">${entry.substring(0, 150)}${entry.length > 150 ? '...' : ''}</p>
                </div>
            `;
        }
    });
    
    if (entriesHTML) {
        entriesElement.innerHTML = entriesHTML;
    } else {
        entriesElement.innerHTML = '<p class="text-soft-cream/60 text-sm italic">No journal entries found for this week.</p>';
    }
}

// Load weekly quote for reflection
function loadWeeklyQuote() {
    const quoteElement = document.getElementById('weekly-quote');
    if (!quoteElement) return;
    
    // Get a random quote for weekly reflection
    if (quotes.length > 0) {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        quoteElement.textContent = `"${randomQuote.quote}"`;
    }
}

// Reset week function
function resetWeek() {
    if (confirm('Are you sure you want to reset this week? This will clear all journal entries, completions, and reflections.')) {
        // Clear all ritual data
        days.forEach(day => {
            localStorage.removeItem(`ritual-journal-${day}`);
            localStorage.removeItem(`ritual-journal-${day}-date`);
            localStorage.removeItem(`ritual-complete-${day}`);
            localStorage.removeItem(`ritual-complete-${day}-date`);
        });
        
        // Clear weekly reflection
        localStorage.removeItem('ritual-weekly-reflection');
        
        // Clear completion history for this week
        const history = getCompletionHistory();
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        for (let d = new Date(weekAgo); d <= now; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            if (history[dateStr]) {
                delete history[dateStr];
            }
        }
        localStorage.setItem('ritual-completion-history', JSON.stringify(history));
        
        showNotification('Week reset successfully', 'success');
        
        // Reload page to reflect changes
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
}

// Show notification function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform translate-x-full opacity-0`;
    
    // Style based on type
    switch (type) {
        case 'success':
            notification.className += ' bg-mint/90 text-dark-indigo border border-mint';
            break;
        case 'error':
            notification.className += ' bg-rose-clay/90 text-soft-cream border border-rose-clay';
            break;
        default:
            notification.className += ' bg-amethyst/90 text-soft-cream border border-amethyst';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full', 'opacity-0');
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Utility function to capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Auto-save journal entries as user types (debounced)
function setupAutoSave() {
    let saveTimeout;
    
    days.forEach(day => {
        const textarea = document.getElementById(`${day}-journal`);
        if (textarea) {
            textarea.addEventListener('input', function() {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    saveJournalEntry(day);
                }, 2000); // Auto-save after 2 seconds of inactivity
            });
        }
    });
}

// Initialize auto-save when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAutoSave);
} else {
    setupAutoSave();
}
