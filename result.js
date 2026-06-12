let username = localStorage.getItem("githubUser"); //gets saved GitHub username from browser storage
let profileData = null;  //will store fetched GitHub user data

// Initialize page
document.addEventListener('DOMContentLoaded', function() {  //Runs code after HTML is fully loaded
    // Set analysis date (to show the current date)
    const date = new Date();
    document.getElementById('analysisDate').textContent = 
        `Analyzed on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
    
    // Load theme preference //for the dark/light mode
    const isDark = localStorage.getItem('darkMode') !== 'false';
    if (!isDark) {
        document.body.classList.add('light-theme');
        document.querySelector('#themeToggle i').className = 'fas fa-sun';
    }
    
    // Fetch data
    fetchGitHubData();
});

function fetchGitHubData() { //Check Username
    if (!username) {
        showError('No username provided');
        return;
    }

    // Show loading, hide result and error
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';

    // Fetch user data
    fetch(`https://api.github.com/users/${username}`)  //API(app prog interface) call //fetch()= makes HTTP request
        .then(response => {
            if (!response.ok) {
                throw new Error(response.status === 404 ? 'User not found' : 'GitHub API error');
            }
            return response.json();
        })
        .then(userData => {
            profileData = userData;
            return fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
        })
        .then(response => response.json())
        .then(reposData => {
            displayResults(profileData, reposData);
        })
        .catch(error => {
            showError(error.message);
        });
}

function displayResults(user, repos) {
    // Calculate metrics
    const totalRepos = repos.length || 0;
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
    
    // Language analysis
    const languages = {};
    repos.forEach(repo => {
        if (repo.language) {
            languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
    });
    
    const topLanguages = Object.entries(languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang, count]) => `${lang} (${count})`)
        .join(', ');
    
    // Calculate score (0-100)
    let score = 0;
    
    // Repository score (max 30)
    score += Math.min(totalRepos * 2, 30);
    
    // Followers score (max 25)
    score += Math.min(user.followers * 0.5, 25);
    
    // Stars score (max 25)
    score += Math.min(totalStars * 0.1, 25);
    
    // Language diversity score (max 20)
    score += Math.min(Object.keys(languages).length * 4, 20);
    
    // Round to nearest integer
    score = Math.round(score);
    
    // Determine level
    let level, levelColor;
    if (score >= 90) {
        level = 'Elite Developer';
        levelColor = '#fbbf24';
    } else if (score >= 75) {
        level = 'Advanced Developer';
        levelColor = '#10b981';
    } else if (score >= 50) {
        level = 'Intermediate Developer';
        levelColor = '#3b82f6';
    } else if (score >= 25) {
        level = 'Junior Developer';
        levelColor = '#f59e0b';
    } else {
        level = 'Getting Started';
        levelColor = '#ef4444';
    }
    
    // Generate suggestions
    const suggestions = [];
    
    if (totalRepos < 10) {
        suggestions.push({
            icon: 'fa-code-branch',
            text: 'Add more repositories to showcase your work',
            priority: 'high'
        });
    }
    
    if (user.followers < 10) {
        suggestions.push({
            icon: 'fa-users',
            text: 'Engage with the community to increase followers',
            priority: 'medium'
        });
    }
    
    if (Object.keys(languages).length < 3) {
        suggestions.push({
            icon: 'fa-code',
            text: 'Learn and use more programming languages',
            priority: 'high'
        });
    }
    
    if (totalStars < 10) {
        suggestions.push({
            icon: 'fa-star',
            text: 'Create popular repositories to earn more stars',
            priority: 'medium'
        });
    }
    
    if (!user.bio) {
        suggestions.push({
            icon: 'fa-user',
            text: 'Add a bio to your profile',
            priority: 'low'
        });
    }
    
    if (!user.company) {
        suggestions.push({
            icon: 'fa-building',
            text: 'Add your company to your profile',
            priority: 'low'
        });
    }
    
    if (!user.blog) {
        suggestions.push({
            icon: 'fa-globe',
            text: 'Add your website or blog to your profile',
            priority: 'low'
        });
    }
    
    if (repos.filter(r => r.description).length < totalRepos * 0.5) {
        suggestions.push({
            icon: 'fa-file-alt',
            text: 'Add descriptions to your repositories',
            priority: 'medium'
        });
    }
    
    // Get top repositories
    const topRepos = repos
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 6);
    
    // Build HTML
    const html = `
        <div class="card-grid">
            <!-- Profile Card -->
            <div class="profile-card">
                <img src="${user.avatar_url}" alt="${user.login}">
                <h2>${user.name || user.login}</h2>
                <p class="profile-bio">${user.bio || 'No bio provided'}</p>
                
                <div class="profile-stats">
                    <div class="stat">
                        <div class="stat-value">${user.followers}</div>
                        <div class="stat-label">Followers</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${user.following}</div>
                        <div class="stat-label">Following</div>
                    </div>
                </div>
                
                <div style="margin-top: 1rem; text-align: left;">
                    ${user.company ? `
                        <p><i class="fas fa-building" style="color: var(--gray); width: 20px;"></i> ${user.company}</p>
                    ` : ''}
                    ${user.location ? `
                        <p><i class="fas fa-map-marker-alt" style="color: var(--gray); width: 20px;"></i> ${user.location}</p>
                    ` : ''}
                    ${user.blog ? `
                        <p><i class="fas fa-link" style="color: var(--gray); width: 20px;"></i> <a href="${user.blog}" target="_blank">Website</a></p>
                    ` : ''}
                    <p><i class="fas fa-calendar" style="color: var(--gray); width: 20px;"></i> Joined ${new Date(user.created_at).toLocaleDateString()}</p>
                </div>
            </div>
            
            <!-- Metrics Section -->
            <div class="metrics-section">
                <!-- Score Card -->
                <div class="metric-card">
                    <div class="metric-header">
                        <i class="fas fa-trophy"></i>
                        <h3>Developer Score</h3>
                    </div>
                    
                    <div class="progress-container">
                        <div class="progress-label">
                            <span>Overall Score</span>
                            <span style="color: var(--primary); font-weight: 700;">${score}/100</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${score}%;">
                                ${score}%
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 1rem; text-align: center;">
                        <span style="
                            display: inline-block;
                            padding: 0.5rem 1.5rem;
                            background: ${levelColor}20;
                            color: ${levelColor};
                            border-radius: 50px;
                            font-weight: 600;
                            border: 1px solid ${levelColor}40;
                        ">
                            <i class="fas fa-crown"></i> ${level}
                        </span>
                    </div>
                </div>
                
                <!-- Stats Card -->
                <div class="metric-card">
                    <div class="metric-header">
                        <i class="fas fa-chart-bar"></i>
                        <h3>GitHub Statistics</h3>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
                        <div style="text-align: center;">
                            <div style="font-size: 1.8rem; font-weight: 700; color: var(--primary);">${totalRepos}</div>
                            <div style="font-size: 0.9rem; color: var(--gray);">Repositories</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 1.8rem; font-weight: 700; color: var(--primary);">${totalStars}</div>
                            <div style="font-size: 0.9rem; color: var(--gray);">Total Stars</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 1.8rem; font-weight: 700; color: var(--primary);">${totalForks}</div>
                            <div style="font-size: 0.9rem; color: var(--gray);">Total Forks</div>
                        </div>
                    </div>
                    
                    ${topLanguages ? `
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                            <p style="margin-bottom: 0.5rem;"><i class="fas fa-code"></i> Top Languages:</p>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                ${Object.entries(languages)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 4)
                                    .map(([lang, count]) => `
                                        <span style="
                                            padding: 0.25rem 0.75rem;
                                            background: rgba(79,70,229,0.1);
                                            border-radius: 50px;
                                            font-size: 0.9rem;
                                            border: 1px solid rgba(79,70,229,0.3);
                                        ">${lang}</span>
                                    `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Suggestions Card -->
                <div class="metric-card">
                    <div class="metric-header">
                        <i class="fas fa-lightbulb"></i>
                        <h3>Improvement Suggestions</h3>
                    </div>
                    
                    <ul class="suggestions-list">
                        ${suggestions.map(s => `
                            <li style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                                <i class="fas ${s.icon}" style="color: ${s.priority === 'high' ? '#ef4444' : s.priority === 'medium' ? '#f59e0b' : '#10b981'}; width: 20px;"></i>
                                <span style="flex: 1;">${s.text}</span>
                                <span style="
                                    font-size: 0.8rem;
                                    padding: 0.2rem 0.5rem;
                                    background: ${s.priority === 'high' ? '#ef4444' : s.priority === 'medium' ? '#f59e0b' : '#10b981'}20;
                                    border-radius: 50px;
                                    text-transform: capitalize;
                                ">${s.priority}</span>
                            </li>
                        `).join('')}
                        ${suggestions.length === 0 ? `
                            <li style="text-align: center; color: var(--success); padding: 1rem;">
                                <i class="fas fa-check-circle"></i> Excellent profile! No improvements needed.
                            </li>
                        ` : ''}
                    </ul>
                </div>
                
                <!-- Top Repositories Card -->
                <div class="metric-card">
                    <div class="metric-header">
                        <i class="fas fa-star"></i>
                        <h3>Top Repositories</h3>
                    </div>
                    
                    <div class="repos-grid">
                        ${topRepos.map(repo => `
                            <a href="${repo.html_url}" target="_blank" class="repo-item" style="text-decoration: none; color: inherit;">
                                <div class="repo-name">
                                    <i class="fas fa-book"></i> ${repo.name}
                                </div>
                                <p style="font-size: 0.9rem; color: var(--gray); margin-bottom: 0.5rem;">
                                    ${repo.description ? repo.description.substring(0, 60) + '...' : 'No description'}
                                </p>
                                <div class="repo-stats">
                                    <span><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
                                    <span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
                                    <span><i class="fas fa-circle" style="color: ${repo.language ? '#4f46e5' : '#64748b'};"></i> ${repo.language || 'Unknown'}</span>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Update UI
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('result').innerHTML = html;
}

function showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

function goBack() {
    window.location.href = "index.html";
}

function toggleDark() {
    document.body.classList.toggle('light-theme');
    const isDark = !document.body.classList.contains('light-theme');
    localStorage.setItem('darkMode', isDark);
    
    const icon = document.querySelector('#themeToggle i');
    icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
}

function shareOnTwitter() {
    const text = `Check out my GitHub portfolio score on DevScorePro!`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
}

function shareOnLinkedIn() {
    const url = window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
}

function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link copied to clipboard!');
    });
}