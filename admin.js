import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, setDoc, getDoc, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA4sz93sOlFGXQYbPaQn5FrErs3t9ihD8A",
    authDomain: "website-adcb1.firebaseapp.com",
    projectId: "website-adcb1",
    storageBucket: "website-adcb1.firebasestorage.app",
    messagingSenderId: "410424437804",
    appId: "1:410424437804:web:615035eca8182687fdf589",
    measurementId: "G-9FRNGWJKS5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const screens = {
    login: document.getElementById('login-screen'),
    dashboard: document.getElementById('dashboard-screen')
};

const forms = {
    signin: document.getElementById('signin-form'),
    signup: document.getElementById('signup-form')
};

const errors = {
    signin: document.getElementById('signin-error'),
    signup: document.getElementById('signup-error')
};

const elements = {
    authWrapper: document.querySelector('.auth-wrapper'),
    loginTrigger: document.querySelector('.login-trigger'),
    registerTrigger: document.querySelector('.register-trigger'),
    navBtns: document.querySelectorAll('.nav-btn'),
    pages: document.querySelectorAll('.page'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Stats
    statOrders: document.getElementById('stat-orders'),
    statPending: document.getElementById('stat-pending'),
    statRevenue: document.getElementById('stat-revenue'),
    statCompleted: document.getElementById('stat-completed'),
    statClients: document.getElementById('stat-clients'),
    statReviews: document.getElementById('stat-reviews'),
    
    // Containers
    ordersBody: document.getElementById('orders-body'),
    clientsGrid: document.getElementById('clients-grid'),
    reviewsGrid: document.getElementById('reviews-grid'),
    
    // Modal
    modal: document.getElementById('order-modal'),
    modalClose: document.getElementById('modal-close'),
    replyForm: document.getElementById('reply-form')
};

let currentOrders = [];
let selectedOrderId = null;

// Initialization
lucide.createIcons();
updateClock();
setInterval(updateClock, 1000);

// Glow Effect
document.addEventListener('mousemove', (e) => {
    const orb = document.querySelector('.glow-orb');
    if(orb && !screens.dashboard.classList.contains('hide')) {
        orb.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
    }
});

// Password Visibility Toggle
window.togglePwd = (id, btn) => {
    const input = document.getElementById(id);
    if (!input) return;
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    } else {
        input.type = 'password';
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
};

// UI Logic - Auth Toggle
if(elements.registerTrigger && elements.loginTrigger) {
    const formTitle = document.querySelector('.auth-form-title');
    const formSub = document.querySelector('.auth-form-sub');
    
    elements.registerTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (forms.signin) forms.signin.classList.add('hide');
        if (forms.signup) forms.signup.classList.remove('hide');
        if (formTitle) formTitle.textContent = 'Create Account 🚀';
        if (formSub) formSub.textContent = 'Sign up for a new admin account';
    });
    elements.loginTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (forms.signup) forms.signup.classList.add('hide');
        if (forms.signin) forms.signin.classList.remove('hide');
        if (formTitle) formTitle.textContent = 'Welcome Back 👋';
        if (formSub) formSub.textContent = 'Sign in to your admin dashboard';
    });
}

// UI Logic - Navigation
elements.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        
        elements.navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        elements.pages.forEach(p => p.classList.add('hide'));
        document.getElementById(`page-${target}`).classList.remove('hide');
        
        if(target === 'dashboard' || target === 'analytics') renderCharts();
        
        // Close mobile sidebar if open
        document.body.classList.remove('mobile-open');
        document.getElementById('mobile-overlay').classList.add('hide');
    });
});

// Mobile Hamburger Menu
document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.body.classList.add('mobile-open');
    document.getElementById('mobile-overlay').classList.remove('hide');
});

document.getElementById('mobile-overlay').addEventListener('click', () => {
    document.body.classList.remove('mobile-open');
    document.getElementById('mobile-overlay').classList.add('hide');
});

// Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        screens.login.classList.add('hide');
        screens.dashboard.classList.remove('hide');
        loadData();
        setTimeout(() => logActivity('success', `Admin signed in as ${user.email}`), 600);
    } else {
        screens.dashboard.classList.add('hide');
        screens.login.classList.remove('hide');
    }
});

// Auth Actions
forms.signin.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        errors.signin.classList.add('hide');
        await signInWithEmailAndPassword(auth, document.getElementById('signin-email').value, document.getElementById('signin-password').value);
    } catch (error) {
        errors.signin.textContent = error.message;
        errors.signin.classList.remove('hide');
        setTimeout(() => logActivity('error', `Login failed: ${error.code}`), 600);
    }
});

forms.signup.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        errors.signup.classList.add('hide');
        await createUserWithEmailAndPassword(auth, document.getElementById('signup-email').value, document.getElementById('signup-password').value);
    } catch (error) {
        errors.signup.textContent = error.message;
        errors.signup.classList.remove('hide');
    }
});

elements.logoutBtn.addEventListener('click', async () => {
    logActivity('warning', 'Admin signed out.');
    await signOut(auth);
});

// Global State
let isInitialLoad = { orders: true, replies: true, reviews: true, notifications: true };
let currentReplies = [];
let currentReviews = [];
let globalChartLabels = [];
let globalChartRevData = [];
let globalChartCliData = [];
let unlisteners = [];

// Initialize Realtime Listeners
function loadData() {
    // Request Browser Notification Permission
    if ("Notification" in window) {
        Notification.requestPermission();
    }

    // 1. Listen to Notifications Collection
    unlisteners.push(onSnapshot(collection(db, "notifications"), (snap) => {
        const notifs = [];
        let unreadCount = 0;
        
        snap.docChanges().forEach(change => {
            if (change.type === "added" && !isInitialLoad.notifications) {
                const n = change.doc.data();
                showToast(n.title, n.message, n.type);
                playNotificationSound();
                if(Notification.permission === 'granted') {
                    new Notification(n.title, { body: n.message, icon: 'https://ui-avatars.com/api/?name=L&background=6366F1&color=fff' });
                }
            }
        });
        
        snap.forEach(doc => {
            const data = doc.data();
            notifs.push({ id: doc.id, ...data });
            if(!data.read) unreadCount++;
        });
        
        notifs.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        renderNotifications(notifs, unreadCount);
        isInitialLoad.notifications = false;
    }));

    // 2. Listen to Orders
    unlisteners.push(onSnapshot(collection(db, "orders"), (snap) => {
        snap.docChanges().forEach(change => {
            if (change.type === "added" && !isInitialLoad.orders) {
                createAdminNotification('order', 'New Website Order', `${change.doc.data().name} submitted a request for: ${change.doc.data().subject}`);
                logActivity('info', `New order from ${change.doc.data().name}: "${change.doc.data().subject}"`);
            } else if (change.type === "modified" && !isInitialLoad.orders) {
                const d = change.doc.data();
                if(d.status === 'completed') {
                    createAdminNotification('success', 'Project Completed', `${d.name}'s order has been marked completed.`);
                    logActivity('success', `Order completed for client: ${d.name}`);
                } else {
                    createAdminNotification('order', 'Order Updated', `${d.name}'s order is now ${d.status}.`);
                    logActivity('warning', `Order status changed → ${d.status} for ${d.name}`);
                }
            } else if (change.type === "removed" && !isInitialLoad.orders) {
                logActivity('error', `Order deleted: ${change.doc.data().name}`);
            }
        });
        
        currentOrders = [];
        snap.forEach(doc => currentOrders.push({ id: doc.id, ...doc.data() }));
        currentOrders.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        isInitialLoad.orders = false;
        processAnalytics();
    }));

    // 3. Listen to Replies (Revenue)
    unlisteners.push(onSnapshot(collection(db, "replies"), (snap) => {
        snap.docChanges().forEach(change => {
            if (change.type === "added" && !isInitialLoad.replies) {
                createAdminNotification('success', 'Quotation Sent', `Price quotation of ${change.doc.data().price} sent successfully.`);
                logActivity('success', `Quotation sent: ${change.doc.data().price} to client.`);
            }
        });
        currentReplies = [];
        snap.forEach(doc => currentReplies.push({ id: doc.id, ...doc.data() }));
        isInitialLoad.replies = false;
        processAnalytics();
    }));

    // 4. Listen to Reviews
    unlisteners.push(onSnapshot(collection(db, "reviews"), (snap) => {
        snap.docChanges().forEach(change => {
            if (change.type === "added" && !isInitialLoad.reviews) {
                createAdminNotification('review', 'New Review Received', `${change.doc.data().name} gave ${change.doc.data().rating} stars.`);
                logActivity('info', `New review from ${change.doc.data().name} — ${change.doc.data().rating}★`);
            }
        });
        currentReviews = [];
        snap.forEach(doc => currentReviews.push({ id: doc.id, ...doc.data() }));
        isInitialLoad.reviews = false;
        processAnalytics();
    }));

    // 6. Listen to Site Settings
    unlisteners.push(onSnapshot(doc(db, "settings", "config"), (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            const isMaintenance = !!data.maintenanceMode;
            
            const toggle = document.getElementById('maintenance-global-toggle');
            const label = document.getElementById('maintenance-toggle-label');
            if (toggle) {
                toggle.checked = isMaintenance;
            }
            if (label) {
                label.textContent = isMaintenance ? 'ON' : 'OFF';
                label.style.color = isMaintenance ? '#34d399' : '#f87171';
            }
            
            // Sync legacy toggle as well just in case
            const legacyToggle = document.getElementById('settings-maintenance');
            if (legacyToggle) {
                legacyToggle.checked = isMaintenance;
            }
        }
    }));

    unlisteners.push(onSnapshot(doc(db, "services", "maintenance"), (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            const isLegacyMaintenance = !!data.enabled;
            
            // Fallback sync to new toggle
            const toggle = document.getElementById('maintenance-global-toggle');
            const label = document.getElementById('maintenance-toggle-label');
            const legacyToggle = document.getElementById('settings-maintenance');
            
            if (legacyToggle) {
                legacyToggle.checked = isLegacyMaintenance;
            }
            if (toggle && !toggle.checked && isLegacyMaintenance) {
                toggle.checked = true;
                if (label) {
                    label.textContent = 'ON';
                    label.style.color = '#34d399';
                }
            }
        }
    }));

    // 5. Boot terminal and load service config from Firestore
    initTerminal();
    loadServiceConfigs().then(() => logActivity('info', 'Service configs loaded.'));
}

// Process Realtime Data for Analytics & Dashboard
function processAnalytics() {
    let pCount = 0, cCount = 0, totalRevenue = 0;
    const clientsMap = new Map();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = new Array(12).fill(0);
    const monthlyClients = new Array(12).fill(0);

    // Process Orders
    currentOrders.forEach(d => {
        if (d.status === "pending") pCount++;
        if (d.status === "completed") cCount++;
        
        if (d.email && !clientsMap.has(d.email)) {
            clientsMap.set(d.email, { name: d.name, phone: d.phone, email: d.email, ordersCount: 0, spent: 0 });
            if(d.createdAt) {
                const date = d.createdAt.toDate();
                if(date.getFullYear() === currentYear) monthlyClients[date.getMonth()]++;
            }
        }
        if(d.email) {
            const client = clientsMap.get(d.email);
            client.ordersCount++;
            clientsMap.set(d.email, client);
        }
    });

    // Process Revenue from Replies
    currentReplies.forEach(r => {
        const priceValue = parseFloat(r.price?.replace(/[^0-9.-]+/g,"")) || 0;
        const relatedOrder = currentOrders.find(o => o.id === r.orderId);
        
        if (relatedOrder && relatedOrder.status === 'completed') {
            totalRevenue += priceValue;
            if(relatedOrder.email) {
                const client = clientsMap.get(relatedOrder.email);
                if(client) { client.spent += priceValue; clientsMap.set(relatedOrder.email, client); }
            }
            if(r.createdAt) {
                const date = r.createdAt.toDate();
                if(date.getFullYear() === currentYear) monthlyRevenue[date.getMonth()] += priceValue;
            }
        }
    });

    const clients = Array.from(clientsMap.values());

    // Update DOM Stats
    animateValue(elements.statOrders, 0, currentOrders.length, 1000);
    animateValue(elements.statPending, 0, pCount, 1000);
    animateValue(elements.statRevenue, 0, totalRevenue, 1000, true);
    animateValue(elements.statCompleted, 0, cCount, 1000);
    animateValue(elements.statClients, 0, clients.length, 1000);
    animateValue(elements.statReviews, 0, currentReviews.length, 1000);
    
    document.getElementById('nav-badge-orders').textContent = pCount;
    const mobileBadge = document.getElementById('b-nav-badge-orders');
    if(mobileBadge) mobileBadge.textContent = pCount;

    const profileStatOrders = document.getElementById('profile-stat-orders');
    const profileStatRev    = document.getElementById('profile-stat-rev');
    const profileStatReviews = document.getElementById('profile-stat-reviews');
    if (profileStatOrders)  profileStatOrders.textContent  = currentOrders.length;
    if (profileStatRev)     profileStatRev.textContent     = `$${(totalRevenue/1000).toFixed(1)}k`;
    if (profileStatReviews) profileStatReviews.textContent = currentReviews.length;

    // ── Sync Edit Profile stats (real-time) ──
    updateEpStats(
        currentOrders.length,
        cCount,
        pCount,
        `$${(totalRevenue/1000).toFixed(1)}k`,
        currentReviews.length
    );

    // Prep Charts
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    globalChartLabels = []; globalChartRevData = []; globalChartCliData = [];
    
    for(let i = 5; i >= 0; i--) {
        let m = currentMonth - i;
        if(m < 0) m += 12;
        globalChartLabels.push(months[m]);
        globalChartRevData.push(monthlyRevenue[m]);
        globalChartCliData.push(monthlyClients[m]);
    }

    // Render
    renderOrders(currentOrders);
    renderClients(clients);
    renderReviews(currentReviews);
    renderCharts();
    lucide.createIcons();
}

// Notification System Functions
async function createAdminNotification(type, title, message) {
    try {
        await addDoc(collection(db, "notifications"), {
            type, title, message, read: false, createdAt: serverTimestamp()
        });
    } catch(err) { console.error(err); }
}

function showToast(title, message, type) {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'bell';
    if(type === 'order') icon = 'shopping-cart';
    if(type === 'review') icon = 'star';
    if(type === 'success') icon = 'check-circle';
    
    toast.innerHTML = `
        <div class="toast-icon"><i data-lucide="${icon}"></i></div>
        <div><h4>${title}</h4><p>${message}</p></div>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

const notifSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
function playNotificationSound() {
    notifSound.play().catch(e => console.log('Audio autoplay prevented'));
}

// iOS Style Confirm Dialog
function iosConfirm(title, message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('ios-confirm');
        const titleEl = document.getElementById('ios-confirm-title');
        const msgEl   = document.getElementById('ios-confirm-message');
        const okBtn   = document.getElementById('ios-confirm-ok');
        const cancelBtn = document.getElementById('ios-confirm-cancel');

        titleEl.textContent = title || 'Are you sure?';
        msgEl.textContent = message || '';
        overlay.classList.remove('hide');

        const cleanup = () => overlay.classList.add('hide');
        const handleOk = () => { cleanup(); okBtn.removeEventListener('click', handleOk); cancelBtn.removeEventListener('click', handleCancel); resolve(true); };
        const handleCancel = () => { cleanup(); okBtn.removeEventListener('click', handleOk); cancelBtn.removeEventListener('click', handleCancel); resolve(false); };

        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
    });
}

function renderNotifications(notifs, unreadCount) {
    const dot = document.getElementById('notif-dot');
    const list = document.getElementById('notif-list');
    
    if(unreadCount > 0) {
        dot.classList.remove('hide');
    } else {
        dot.classList.add('hide');
    }

    if(notifs.length === 0) {
        list.innerHTML = '<div class="no-notifs">No new notifications</div>';
        return;
    }

    list.innerHTML = notifs.map(n => {
        let timeAgo = n.createdAt ? Math.floor((Date.now() - n.createdAt.toMillis()) / 60000) : 0;
        let timeStr = timeAgo === 0 ? 'Just now' : timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo/60)}h ago`;
        
        return `
        <div class="notif-item ${n.read ? '' : 'unread'}">
            <div class="notif-item-header">
                <span class="notif-title">${n.title}</span>
                <span class="notif-time">${timeStr}</span>
            </div>
            <p class="notif-message">${n.message}</p>
            <div class="notif-item-actions">
                ${!n.read ? `<button class="notif-btn read" onclick="markNotifRead('${n.id}')">Mark Read</button>` : ''}
                <button class="notif-btn del" onclick="deleteDocItem('notifications', '${n.id}')">Delete</button>
            </div>
        </div>
    `}).join('');
}

window.markNotifRead = async (id) => {
    try { await updateDoc(doc(db, "notifications", id), { read: true }); } catch(err) {}
};
window.markAllNotificationsRead = async () => {
    try {
        const snap = await getDocs(collection(db, "notifications"));
        snap.forEach(d => { if(!d.data().read) updateDoc(doc(db, "notifications", d.id), { read: true }); });
    } catch(err) {}
};
window.clearAllNotifications = async () => {
    const ok = await iosConfirm('Clear Notifications', 'All notifications will be permanently deleted.');
    if(!ok) return;
    try {
        const snap = await getDocs(collection(db, "notifications"));
        snap.forEach(d => deleteDoc(doc(db, "notifications", d.id)));
    } catch(err) {}
};

// ─── ACTIVITY LOG SYSTEM ────────────────────────────────────────────────────
const activityLogs = [];

function logActivity(type, message) {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    activityLogs.push({ type, message, time });
    const terminal = document.getElementById('terminal-body');
    if (!terminal) return;
    const typeColors = { info: '#0a84ff', success: '#30d158', warning: '#ffd60a', error: '#ff453a' };
    const line = document.createElement('div');
    line.className = 'term-line';
    line.innerHTML = `<span class="term-time">[${time}]</span><span class="term-tag ${type}" style="color:${typeColors[type] || '#0a84ff'}">[${type.toUpperCase()}]</span><span>${message}</span>`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function initTerminal() {
    const terminal = document.getElementById('terminal-body');
    if (!terminal) return;
    terminal.innerHTML = `<div class="term-line" style="color:#8e8e93; margin-bottom:16px;">$ AdminOS System Log - Session started at ${new Date().toLocaleString()}</div>`;
    logActivity('info', 'Admin session initialized.');
    logActivity('success', 'Firebase connection established.');
    logActivity('info', 'Loading dashboard data...');
}

window.clearSystemLogs = async () => {
    const ok = await iosConfirm('Clear Logs', 'All activity logs will be cleared for this session.');
    if (!ok) return;
    activityLogs.length = 0;
    initTerminal();
    showToast('Logs Cleared', 'Terminal has been reset.', 'order');
};

window.downloadSystemLogs = () => {
    const text = activityLogs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adminos-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    logActivity('success', 'Logs exported successfully.');
    showToast('Logs Exported', 'Log file downloaded.', 'success');
};

// ─── SERVICES MANAGER ───────────────────────────────────────────────────────
window.updateServiceBadge = (serviceId) => {
    const select = document.getElementById(`srv-status-${serviceId}`);
    const badge = document.getElementById(`badge-${serviceId}`);
    if (!select || !badge) return;
    const val = select.value;
    badge.className = 'status-badge';
    if (val === 'online') { badge.classList.add('srv-active'); badge.textContent = 'Online'; }
    else if (val === 'maintenance') { badge.classList.add('srv-maintenance'); badge.textContent = 'Maintenance'; }
    else { badge.classList.add('srv-offline'); badge.textContent = 'Offline'; }
};

window.saveServiceConfig = async (serviceId) => {
    const price = document.getElementById(`srv-price-${serviceId}`)?.value;
    const status = document.getElementById(`srv-status-${serviceId}`)?.value;
    try {
        await setDoc(doc(db, 'services', serviceId), { price: Number(price), status, updatedAt: serverTimestamp() }, { merge: true });
        updateServiceBadge(serviceId);
        showToast('Service Updated', `${serviceId} config saved successfully.`, 'success');
        logActivity('success', `Service [${serviceId}] updated: price=$${price}, status=${status}`);
    } catch (err) {
        showToast('Save Failed', 'Could not save service config.', 'review');
        logActivity('error', `Failed to save service [${serviceId}]: ${err.message}`);
    }
};

async function loadServiceConfigs() {
    const serviceIds = ['landing', 'portfolio', 'ecommerce'];
    for (const id of serviceIds) {
        try {
            const snap = await getDoc(doc(db, 'services', id));
            if (snap.exists()) {
                const data = snap.data();
                const priceEl = document.getElementById(`srv-price-${id}`);
                const statusEl = document.getElementById(`srv-status-${id}`);
                if (priceEl && data.price !== undefined) priceEl.value = data.price;
                if (statusEl && data.status) { statusEl.value = data.status; updateServiceBadge(id); }
            }
        } catch (err) {}
    }
}

// UI Toggles

// Function to update maintenance status globally across both collections
async function updateMaintenanceStatus(isMaintenance) {
    try {
        // Save to the new settings collection as requested
        await setDoc(doc(db, 'settings', 'config'), {
            maintenanceMode: isMaintenance,
            updatedAt: serverTimestamp()
        }, { merge: true });

        // Save to the legacy services/maintenance document
        await setDoc(doc(db, 'services', 'maintenance'), {
            enabled: isMaintenance,
            updatedAt: serverTimestamp()
        }, { merge: true });

        showToast(
            isMaintenance ? 'Maintenance Mode Enabled 🛡' : 'Maintenance Mode Disabled 🌐',
            isMaintenance ? 'The main website is now offline.' : 'The main website is now online.',
            'success'
        );
        logActivity(
            isMaintenance ? 'warning' : 'success',
            `Maintenance mode changed globally → ${isMaintenance ? 'ENABLED' : 'DISABLED'}`
        );
    } catch (err) {
        showToast('Update Failed', 'Failed to update maintenance settings.', 'review');
        logActivity('error', `Failed to update settings: ${err.message}`);
        throw err;
    }
}

// 1. New Global Toggle on the dedicated Maintenance Mode Page
const globalMaintenanceToggle = document.getElementById('maintenance-global-toggle');
if (globalMaintenanceToggle) {
    globalMaintenanceToggle.addEventListener('change', async (e) => {
        const isMaintenance = e.target.checked;
        try {
            await updateMaintenanceStatus(isMaintenance);
        } catch (err) {
            e.target.checked = !isMaintenance;
        }
    });
}

// 2. Legacy Toggle on the Settings Page
const settingsMaintenanceToggle = document.getElementById('settings-maintenance');
if (settingsMaintenanceToggle) {
    settingsMaintenanceToggle.addEventListener('change', async (e) => {
        const isMaintenance = e.target.checked;
        try {
            await updateMaintenanceStatus(isMaintenance);
        } catch (err) {
            e.target.checked = !isMaintenance;
        }
    });
}

document.getElementById('notif-trigger').addEventListener('click', (e) => {
    if(e.target.closest('.notif-actions') || e.target.closest('.notif-item-actions')) return;
    document.getElementById('notif-dropdown').classList.toggle('hide');
});

// Mobile Bottom Nav Logic
document.querySelectorAll('.b-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.b-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab;
        
        // Sync Sidebar
        elements.navBtns.forEach(b => {
            if(b.dataset.tab === target) b.classList.add('active');
            else b.classList.remove('active');
        });
        
        elements.pages.forEach(p => p.classList.add('hide'));
        document.getElementById(`page-${target}`).classList.remove('hide');
        if(target === 'dashboard' || target === 'analytics') renderCharts();
    });
});

// Rendering Functions
function renderOrders(orders) {
    if (orders.length === 0) {
        elements.ordersBody.innerHTML = '<tr><td colspan="6" style="text-align:center">No orders found.</td></tr>';
        return;
    }

    elements.ordersBody.innerHTML = orders.map(o => `
        <tr>
            <td style="font-family:monospace;color:#9ca3af">#${o.id.substring(0,6)}</td>
            <td>
                <div style="font-weight:700;color:#fff">${o.name}</div>
                <div style="font-size:11px;color:#6b7280">${o.email}</div>
            </td>
            <td>${o.subject}</td>
            <td>${o.createdAt ? new Date(o.createdAt.toMillis()).toLocaleDateString() : 'Just now'}</td>
            <td><span class="badge ${o.status}">${o.status.toUpperCase()}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn view" onclick="openOrderModal('${o.id}')"><i data-lucide="eye"></i></button>
                    <button class="action-btn del" onclick="deleteDocItem('orders', '${o.id}')"><i data-lucide="trash-2"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderClients(clients) {
    elements.clientsGrid.innerHTML = clients.map(c => `
        <div class="g-card client-card">
            <img src="https://ui-avatars.com/api/?name=${c.name}&background=6366F1&color=fff" class="client-avatar" alt="${c.name}">
            <h3 class="client-name">${c.name}</h3>
            <p class="client-email">${c.email}</p>
            <div class="client-stats">
                <div class="client-stat"><p>Orders</p><p>${c.ordersCount}</p></div>
                <div class="client-stat"><p>Spent</p><p style="color:#34d399">$${c.spent}</p></div>
            </div>
            <div class="client-btns">
                <button class="client-btn" onclick="window.location.href='mailto:${c.email}'">Message</button>
                <button class="client-btn" onclick="showToast('Client Profile', 'Detailed profile view for ${c.name} is coming in the next update.', 'success')">Profile</button>
            </div>
        </div>
    `).join('');
}

function renderReviews(reviews) {
    elements.reviewsGrid.innerHTML = reviews.map(r => `
        <div class="g-card review-card">
            <div class="review-header">
                <div class="reviewer-info">
                    <div class="reviewer-avatar">${r.name.charAt(0)}</div>
                    <div>
                        <p class="reviewer-name">${r.name}</p>
                        <div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div>
                    </div>
                </div>
                <span class="badge ${r.approved ? 'completed' : 'pending'}">${r.approved ? 'LIVE' : 'PENDING'}</span>
            </div>
            <p class="review-msg">"${r.message}"</p>
            <div class="review-btns">
                <button class="review-btn approve" onclick="toggleReviewStatus('${r.id}', ${!r.approved})">
                    ${r.approved ? 'HIDE' : 'APPROVE'}
                </button>
                <button class="review-btn reject" onclick="deleteDocItem('reviews', '${r.id}')">DELETE</button>
            </div>
        </div>
    `).join('');
}

// Modal Logic
window.openOrderModal = (id) => {
    const order = currentOrders.find(o => o.id === id);
    if(!order) return;
    selectedOrderId = id;
    
    document.getElementById('m-client-name').textContent = order.name;
    document.getElementById('m-client-email').textContent = order.email;
    document.getElementById('m-client-phone').textContent = order.phone;
    document.getElementById('m-subject').textContent = order.subject;
    document.getElementById('m-content').textContent = order.content;
    
    document.getElementById('reply-section').style.display = order.status === 'pending' ? 'block' : 'none';
    
    elements.modal.classList.remove('hide');
};

elements.modalClose.addEventListener('click', () => {
    elements.modal.classList.add('hide');
    selectedOrderId = null;
});

elements.replyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!selectedOrderId) return;
    
    const subject = document.getElementById('r-subject').value;
    const price = document.getElementById('r-price').value;
    const content = document.getElementById('r-content').value;
    
    try {
        await addDoc(collection(db, "replies"), { 
            orderId: selectedOrderId, subject, price, content, createdAt: serverTimestamp() 
        });
        await updateDoc(doc(db, "orders", selectedOrderId), { status: "processing" });
        elements.modal.classList.add('hide');
        loadData();
    } catch(err) { console.error(err); }
});

window.markOrderCompleted = async () => {
    if(!selectedOrderId) return;
    try {
        await updateDoc(doc(db, "orders", selectedOrderId), { status: "completed" });
        elements.modal.classList.add('hide');
        loadData();
    } catch(err) { console.error(err); }
};

window.deleteDocItem = async (col, id) => {
    const ok = await iosConfirm('Delete Item', 'This action cannot be undone.');
    if(ok) {
        try {
            await deleteDoc(doc(db, col, id));
            loadData();
        } catch(err) { console.error(err); }
    }
};

window.toggleReviewStatus = async (id, status) => {
    try {
        await updateDoc(doc(db, "reviews", id), { approved: status });
        loadData();
    } catch(err) { console.error(err); }
};

// Utilities
function updateClock() {
    const now = new Date();
    const timeEl = document.getElementById('live-time');
    const dateEl = document.getElementById('live-date');
    if(timeEl) timeEl.textContent = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    if(dateEl) dateEl.textContent = now.toLocaleDateString();
}

function animateValue(obj, start, end, duration, isCurrency = false) {
    if(!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const val = Math.floor(progress * (end - start) + start);
        obj.innerHTML = isCurrency ? `$${val.toLocaleString()}` : val;
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// Chart.js Setup
let revChart, clientChart;
function renderCharts() {
    const revCtx = document.getElementById('revenueChart');
    const cliCtx = document.getElementById('clientsChart');
    if(!revCtx || !cliCtx || !globalChartLabels.length) return;

    if(revChart) revChart.destroy();
    if(clientChart) clientChart.destroy();

    Chart.defaults.color = '#6b7280';
    Chart.defaults.font.family = 'Inter';

    const gradientRev = revCtx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradientRev.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradientRev.addColorStop(1, 'rgba(99, 102, 241, 0)');

    revChart = new Chart(revCtx, {
        type: 'line',
        data: {
            labels: globalChartLabels,
            datasets: [{
                label: 'Revenue',
                data: globalChartRevData,
                borderColor: '#6366F1',
                backgroundColor: gradientRev,
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false, drawBorder: false } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } } } }
    });

    clientChart = new Chart(cliCtx, {
        type: 'bar',
        data: {
            labels: globalChartLabels,
            datasets: [{
                label: 'Clients',
                data: globalChartCliData,
                backgroundColor: '#8B5CF6',
                borderRadius: 6
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false, drawBorder: false } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } } } }
    });
}

// =============================================================
// EDIT PROFILE — REAL-TIME SYSTEM
// =============================================================

// Store original values for reset
let _originalProfileData = {};
// Store current photo as base64 (only set when user picks a new one)
let _newPhotoBase64 = null;

// ── Load profile data from Firestore & populate form ──────────
async function loadProfileData() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const snap = await getDoc(doc(db, 'adminProfile', user.uid));
        const data = snap.exists() ? snap.data() : {};

        // Defaults
        const defaults = {
            fullName:    'Loganathan M',
            email:       user.email || '',
            phone:       '',
            role:        'Founder & Web Developer',
            bio:         '',
            location:    '',
            bizName:     'Loganathan Web Services',
            bizEmail:    'contact@loganathan.site',
            bizPhone:    '',
            website:     'https://loganathan.site',
            address:     '',
            instagram:   '',
            linkedin:    '',
            facebook:    '',
            youtube:     '',
            twoFA:       true,
            notifOrder:  true,
            notifReview: true,
            notifEmail:  true,
            notifPush:   true,
            notifSms:    false,
            theme:       'dark',
            memberSince: user.metadata?.creationTime
                ? new Date(user.metadata.creationTime).getFullYear()
                : '—'
        };

        const d = { ...defaults, ...data };
        _originalProfileData = { ...d };

        // Populate Personal
        setVal('ep-fullname',  d.fullName);
        setVal('ep-email',     d.email);
        setVal('ep-phone',     d.phone);
        setVal('ep-role',      d.role);
        setVal('ep-bio',       d.bio, true);
        setVal('ep-location',  d.location);

        // Populate Business
        setVal('ep-biz-name',  d.bizName);
        setVal('ep-biz-email', d.bizEmail);
        setVal('ep-biz-phone', d.bizPhone);
        setVal('ep-website',   d.website);
        setVal('ep-address',   d.address);

        // Social
        setVal('ep-instagram', d.instagram);
        setVal('ep-linkedin',  d.linkedin);
        setVal('ep-facebook',  d.facebook);
        setVal('ep-youtube',   d.youtube);

        // Toggles
        setCheck('ep-2fa',          d.twoFA);
        setCheck('ep-notif-order',  d.notifOrder);
        setCheck('ep-notif-review', d.notifReview);
        setCheck('ep-notif-email',  d.notifEmail);
        setCheck('ep-notif-push',   d.notifPush);
        setCheck('ep-notif-sms',    d.notifSms);

        // Theme
        applyThemeUI(d.theme);

        // Profile card
        setText('ep-card-name', d.fullName);
        setText('ep-card-role', d.role);

        // Photo
        if (data.photoBase64) {
            document.getElementById('ep-photo-preview').src = data.photoBase64;
        }

        // Member since
        setText('ep-st-since', d.memberSince);

    } catch (err) {
        console.error('loadProfileData error:', err);
    }
}

// ── Helpers ───────────────────────────────────────────────────
function setVal(id, val, isTextarea = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isTextarea) el.value = val || '';
    else el.value = val || '';
}
function setCheck(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
}
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '';
}
function getVal(id)   { const e = document.getElementById(id); return e ? e.value.trim() : ''; }
function getCheck(id) { const e = document.getElementById(id); return e ? e.checked : false; }

// ── Update Edit Profile stats from real-time data ─────────────
function updateEpStats(orders, completed, pending, revenue, reviews) {
    setText('ep-st-orders',    orders);
    setText('ep-st-completed', completed);
    setText('ep-st-pending',   pending);
    setText('ep-st-revenue',   revenue);
    setText('ep-st-reviews',   reviews);
}

// ── Save profile to Firestore ─────────────────────────────────
window.saveProfileChanges = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const btn = document.getElementById('ep-save-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i data-lucide="loader" style="width:16px"></i> Saving...'; lucide.createIcons(); }

    try {
        const profileData = {
            fullName:    getVal('ep-fullname'),
            email:       getVal('ep-email'),
            phone:       getVal('ep-phone'),
            role:        getVal('ep-role'),
            bio:         getVal('ep-bio'),
            location:    getVal('ep-location'),
            bizName:     getVal('ep-biz-name'),
            bizEmail:    getVal('ep-biz-email'),
            bizPhone:    getVal('ep-biz-phone'),
            website:     getVal('ep-website'),
            address:     getVal('ep-address'),
            instagram:   getVal('ep-instagram'),
            linkedin:    getVal('ep-linkedin'),
            facebook:    getVal('ep-facebook'),
            youtube:     getVal('ep-youtube'),
            twoFA:       getCheck('ep-2fa'),
            notifOrder:  getCheck('ep-notif-order'),
            notifReview: getCheck('ep-notif-review'),
            notifEmail:  getCheck('ep-notif-email'),
            notifPush:   getCheck('ep-notif-push'),
            notifSms:    getCheck('ep-notif-sms'),
            theme:       document.querySelector('.ep-theme-btn.active')?.dataset?.theme || 'dark',
            updatedAt:   serverTimestamp()
        };

        // Include new photo if one was chosen
        if (_newPhotoBase64) profileData.photoBase64 = _newPhotoBase64;

        await setDoc(doc(db, 'adminProfile', user.uid), profileData, { merge: true });

        // Handle password change
        const curPwd  = getVal('ep-cur-pwd');
        const newPwd  = getVal('ep-new-pwd');
        const confPwd = getVal('ep-conf-pwd');

        if (curPwd && newPwd && confPwd) {
            if (newPwd !== confPwd) {
                showToast('Password Mismatch', 'New passwords do not match.', 'review');
                if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="save" style="width:16px"></i> Save Changes'; lucide.createIcons(); }
                return;
            }
            if (newPwd.length < 6) {
                showToast('Weak Password', 'Password must be at least 6 characters.', 'review');
                if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="save" style="width:16px"></i> Save Changes'; lucide.createIcons(); }
                return;
            }
            try {
                const cred = EmailAuthProvider.credential(user.email, curPwd);
                await reauthenticateWithCredential(user, cred);
                await updatePassword(user, newPwd);
                // Clear password fields
                ['ep-cur-pwd','ep-new-pwd','ep-conf-pwd'].forEach(id => setVal(id, ''));
                showToast('Password Changed', 'Your password has been updated successfully.', 'success');
            } catch (pwdErr) {
                showToast('Wrong Password', 'Current password is incorrect.', 'review');
                if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="save" style="width:16px"></i> Save Changes'; lucide.createIcons(); }
                return;
            }
        }

        // Sync profile card + topbar avatar
        setText('ep-card-name', profileData.fullName);
        setText('ep-card-role', profileData.role);
        _originalProfileData = { ...profileData };
        _newPhotoBase64 = null;

        // Also update the main profile page name display
        const profileName = document.querySelector('.profile-name');
        if (profileName) profileName.textContent = profileData.fullName;

        showToast('Profile Updated Successfully', 'Your profile details have been saved.', 'success');

        setTimeout(() => {
            document.querySelector('.nav-btn[data-tab="profile"]').click();
        }, 1200);

    } catch (err) {
        console.error('saveProfileChanges error:', err);
        showToast('Save Failed', 'Something went wrong. Please try again.', 'review');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="save" style="width:16px"></i> Save Changes'; lucide.createIcons(); }
    }
};

// ── Reset form to last-saved values ──────────────────────────
window.resetProfileChanges = () => {
    const d = _originalProfileData;
    if (!d || !Object.keys(d).length) return;

    setVal('ep-fullname',  d.fullName);
    setVal('ep-email',     d.email);
    setVal('ep-phone',     d.phone);
    setVal('ep-role',      d.role);
    setVal('ep-bio',       d.bio, true);
    setVal('ep-location',  d.location);
    setVal('ep-biz-name',  d.bizName);
    setVal('ep-biz-email', d.bizEmail);
    setVal('ep-biz-phone', d.bizPhone);
    setVal('ep-website',   d.website);
    setVal('ep-address',   d.address);
    setVal('ep-instagram', d.instagram);
    setVal('ep-linkedin',  d.linkedin);
    setVal('ep-facebook',  d.facebook);
    setVal('ep-youtube',   d.youtube);
    setCheck('ep-2fa',          d.twoFA);
    setCheck('ep-notif-order',  d.notifOrder);
    setCheck('ep-notif-review', d.notifReview);
    setCheck('ep-notif-email',  d.notifEmail);
    setCheck('ep-notif-push',   d.notifPush);
    setCheck('ep-notif-sms',    d.notifSms);
    ['ep-cur-pwd','ep-new-pwd','ep-conf-pwd'].forEach(id => setVal(id, ''));
    _newPhotoBase64 = null;

    // Restore photo
    if (d.photoBase64) {
        document.getElementById('ep-photo-preview').src = d.photoBase64;
    } else {
        document.getElementById('ep-photo-preview').src = 'LOGANATHAN.jpeg';
    }

    showToast('Changes Reset', 'Form has been restored to last saved values.', 'order');
};

// ── Remove / restore default photo ───────────────────────────
window.removeProfilePhoto = () => {
    document.getElementById('ep-photo-preview').src = 'LOGANATHAN.jpeg';
    _newPhotoBase64 = null;
    document.getElementById('ep-photo-upload').value = '';
};

// ── Password show/hide toggle ─────────────────────────────────
window.togglePwd = (id) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
};

// ── Logout from Edit Profile page ────────────────────────────
window.handleLogout = () => signOut(auth);

// ── Delete Account ────────────────────────────────────────────
window.handleDeleteAccount = async () => {
    if (!confirm('⚠️ Are you sure you want to permanently delete your account? This cannot be undone.')) return;
    const user = auth.currentUser;
    if (!user) return;
    try {
        await deleteDoc(doc(db, 'adminProfile', user.uid));
        await user.delete();
    } catch (err) {
        showToast('Error', 'Please re-login and try again.', 'review');
    }
};

// ── Theme Buttons ─────────────────────────────────────────────
document.querySelectorAll('.ep-theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.ep-theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

function applyThemeUI(theme) {
    document.querySelectorAll('.ep-theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

// ── Photo upload preview ──────────────────────────────────────
document.getElementById('ep-photo-upload').addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function (ev) {
            _newPhotoBase64 = ev.target.result;
            document.getElementById('ep-photo-preview').src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// ── Load profile data whenever edit-profile page becomes visible ──
// Uses a MutationObserver so it works regardless of which button triggers the switch
const _epPage = document.getElementById('page-edit-profile');
if (_epPage) {
    new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.attributeName === 'class') {
                const isVisible = !_epPage.classList.contains('hide');
                if (isVisible) {
                    loadProfileData();
                    setTimeout(() => lucide.createIcons(), 80);
                }
            }
        }
    }).observe(_epPage, { attributes: true });
}

// =============================================================
// BIOMETRIC AUTHENTICATION (WebAuthn — Mobile Fingerprint)
// =============================================================

(function initBiometric() {
    const card      = document.getElementById('bio-card');
    const statusEl  = document.getElementById('bio-status');
    const statusTxt = document.getElementById('bio-status-text');
    const btnText   = document.getElementById('bio-btn-text');
    const titleEl   = document.getElementById('bio-title');
    const descEl    = document.getElementById('bio-desc');
    const iconEl    = document.getElementById('bio-icon');
    if (!card) return;

    // ── Detect mobile device ───────────────────────────────────
    const ua        = navigator.userAgent.toLowerCase();
    const isIOS     = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isMobile  = isIOS || isAndroid;

    // ── Set label & icon by device ────────────────────────────
    let bioLabel = 'Fingerprint';
    let bioDesc  = 'Use your fingerprint to secure this account';
    let bioIcon  = 'fingerprint';

    if (isIOS) {
        bioLabel = 'Touch ID / Face ID';
        bioDesc  = 'Use Touch ID or Face ID on your iPhone';
        bioIcon  = 'fingerprint';
    } else if (isAndroid) {
        bioLabel = 'Fingerprint Unlock';
        bioDesc  = 'Use your fingerprint sensor to authenticate';
        bioIcon  = 'fingerprint';
    } else {
        // Desktop — show card as informational (disabled)
        bioLabel = 'Fingerprint (Mobile Only)';
        bioDesc  = 'Open on your phone to enable fingerprint login';
        bioIcon  = 'smartphone';
    }

    if (titleEl) titleEl.textContent = bioLabel;
    if (descEl)  descEl.textContent  = bioDesc;

    // ── Check WebAuthn + platform authenticator support ────────
    const BIO_KEY     = 'admin_bio_registered';
    let isRegistered  = localStorage.getItem(BIO_KEY) === 'true';

    async function checkSupport() {
        if (!window.PublicKeyCredential) return false;
        if (!isMobile) return false; // Only mobile fingerprint
        try {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            return available;
        } catch (_) {
            return false;
        }
    }

    // Init UI after support check
    checkSupport().then(supported => {
        if (!supported) {
            card.classList.add('unsupported');
            if (statusTxt) statusTxt.textContent = isMobile ? 'No Fingerprint Sensor' : 'Mobile Only';
            iconEl.innerHTML = `<i data-lucide="${bioIcon}"></i>`;
            lucide.createIcons();
            return;
        }
        applyBioState(isRegistered);
        lucide.createIcons();
    });

    // ── State UI ───────────────────────────────────────────────
    function applyBioState(registered) {
        isRegistered = registered;
        if (registered) {
            card.classList.add('registered');
            card.classList.remove('scanning', 'unsupported');
            statusEl.className        = 'bio-status active';
            statusTxt.textContent     = 'Registered ✓';
            btnText.textContent       = 'Remove';
            iconEl.innerHTML          = '<i data-lucide="shield-check"></i>';
        } else {
            card.classList.remove('registered', 'scanning');
            statusEl.className        = 'bio-status';
            statusTxt.textContent     = 'Not Registered';
            btnText.textContent       = 'Enable';
            iconEl.innerHTML          = `<i data-lucide="${bioIcon}"></i>`;
        }
        lucide.createIcons();
    }

    function setScanningState(on) {
        if (on) {
            card.classList.add('scanning');
            statusEl.className    = 'bio-status scanning-st';
            statusTxt.textContent = 'Scanning fingerprint…';
        } else {
            card.classList.remove('scanning');
        }
    }

    // ── Register fingerprint via WebAuthn ──────────────────────
    async function registerBiometric() {
        setScanningState(true);
        try {
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            // ✅ KEY FIX: Do NOT pass rp.id — browser auto-uses current origin
            // This avoids the "invalid domain" error on IP addresses / localhost
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: {
                        name: 'AdminOS — Loganathan M'
                        // No 'id' here — browser uses current origin automatically
                    },
                    user: {
                        id:          new TextEncoder().encode(auth.currentUser?.uid || 'admin-loga'),
                        name:        auth.currentUser?.email || 'admin@loganathan.site',
                        displayName: 'Loganathan M'
                    },
                    pubKeyCredParams: [
                        { type: 'public-key', alg: -7  }, // ES256
                        { type: 'public-key', alg: -257 } // RS256
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: 'platform', // device sensor only
                        userVerification:        'required', // forces fingerprint/face
                        residentKey:             'preferred'
                    },
                    timeout:     60000,
                    attestation: 'none'
                }
            });

            if (credential) {
                localStorage.setItem(BIO_KEY, 'true');
                setScanningState(false);
                applyBioState(true);
                showToast(`${bioLabel} Enabled ✓`, 'Your fingerprint has been registered.', 'success');
            }

        } catch (err) {
            setScanningState(false);
            applyBioState(false);

            if (err.name === 'NotAllowedError') {
                // User cancelled or timed out
                showToast('Cancelled', 'Fingerprint scan was cancelled. Try again.', 'review');
            } else if (err.name === 'NotSupportedError' || err.name === 'SecurityError') {
                showToast('Not Supported', 'Fingerprint not available on this device.', 'review');
                card.classList.add('unsupported');
            } else if (err.name === 'InvalidStateError') {
                // Already registered — treat as success
                localStorage.setItem(BIO_KEY, 'true');
                applyBioState(true);
                showToast(`${bioLabel} Already Registered`, 'Using existing fingerprint.', 'success');
            } else {
                // Generic — don't show raw browser error to user
                showToast('Fingerprint Setup', 'Place your finger on the sensor and try again.', 'order');
            }
        }
    }

    // ── Remove registered fingerprint ──────────────────────────
    async function removeBiometric() {
        const ok = await iosConfirm(`Remove ${bioLabel}?`, 'Fingerprint will be disabled. You can re-enable it anytime.');
        if (!ok) return;
        localStorage.removeItem(BIO_KEY);
        applyBioState(false);
        showToast(`${bioLabel} Removed`, 'Fingerprint has been disabled.', 'order');
        logActivity('warning', `${bioLabel} authentication removed.`);
    }

    // ── Public handler called by onclick ───────────────────────
    window.handleBiometric = () => {
        if (card.classList.contains('unsupported')) return;
        isRegistered ? removeBiometric() : registerBiometric();
    };

})();

// ═══════════════════════════════════════════════════════════════
//  AI BUSINESS ASSISTANT  — 100% Local, No API Required
//  Trained for: Loganathan M | Web Developer & Website Seller
// ═══════════════════════════════════════════════════════════════

let aiHistory = [];

// ── Knowledge Base ──────────────────────────────────────────────
const AI_KB = {
    // GREETINGS
    greet: {
        patterns: ['hi','hello','helo','hai','vanakkam','namaste','hey','good morning','good evening','good afternoon','sup','yo'],
        responses: [
            `👋 Vanakkam! I'm your AI Business Assistant.\n\nI can help you with:\n• 📧 Writing quotation & client emails\n• 💰 Pricing suggestions\n• 📈 SEO & marketing tips\n• 🌟 Review request messages\n• 🔄 Follow-up messages\n• 📊 Business growth ideas\n\nWhat do you need today?`,
            `Hello! Ready to help your web business grow 🚀\n\nTry asking me:\n→ "Write a quotation for landing page"\n→ "How to get more clients?"\n→ "Draft a follow-up email"\n→ "Give me pricing ideas"`,
        ]
    },

    // QUOTATION
    quotation: {
        patterns: ['quotation','quote','proposal','pricing email','send quote','write quote','quote email','project quote','estimate'],
        responses: [
            `📧 **Professional Quotation Email**\n\nSubject: Website Development Quotation – [Client Name]\n\nDear [Client Name],\n\nThank you for reaching out to Loganathan M Web Services!\n\nAs per your requirements, here is my quotation:\n\n━━━━━━━━━━━━━━━━━━━━━━\n📌 Service: [Service Name]\n💰 Price: ₹[Amount] / $[Amount]\n📅 Delivery: [X] working days\n🛠 Includes: Design + Development + Deployment + 1 month support\n━━━━━━━━━━━━━━━━━━━━━━\n\n✅ What's included:\n• Fully responsive mobile design\n• Fast loading (optimized)\n• Free domain setup assistance\n• Firebase/hosting deployment\n• 30 days post-launch support\n\nPayment: 50% advance, 50% on delivery.\n\nFeel free to reply with any questions. I look forward to working with you!\n\nBest regards,\nLoganathan M\n📞 [Your Phone]\n🌐 web.loganathan.site`,

            `📧 **Short Quotation Template**\n\nHi [Name],\n\nQuick quote for your project:\n\n🔹 Service: [Type]\n🔹 Cost: ₹[Price]\n🔹 Timeline: [X] days\n🔹 Includes: Design, development & deployment\n\n50% upfront to start. Reply to confirm!\n\nThanks,\nLoganathan M | web.loganathan.site`
        ]
    },

    // PRICING
    pricing: {
        patterns: ['price','pricing','cost','how much','rate','charges','package','plan','fees','budget','paisa','rupees','dollars'],
        responses: [
            `💰 **Recommended Pricing Packages**\n\n━━━━━━━━━━━━━━━━━━━━━━\n🥉 STARTER — ₹3,000–₹6,000\n• Single page landing page\n• Mobile responsive\n• Contact form\n• 3–5 day delivery\n━━━━━━━━━━━━━━━━━━━━━━\n🥈 PROFESSIONAL — ₹8,000–₹15,000\n• Multi-page portfolio/business site\n• Firebase backend\n• Admin panel\n• 7–10 day delivery\n━━━━━━━━━━━━━━━━━━━━━━\n🥇 ENTERPRISE — ₹18,000–₹35,000\n• Full web app / E-commerce\n• Payment gateway\n• Custom dashboard\n• 15–25 day delivery\n━━━━━━━━━━━━━━━━━━━━━━\n\n💡 Tip: Always charge 50% advance before starting!`,

            `💡 **Quick Pricing Tips for Web Sellers:**\n\n1. Landing Page → ₹3,000 – ₹8,000\n2. Portfolio Site → ₹6,000 – ₹12,000\n3. E-Commerce → ₹15,000 – ₹40,000\n4. Web App + Dashboard → ₹20,000+\n5. Maintenance (monthly) → ₹1,000 – ₹3,000\n\n👆 Adjust based on client budget & complexity.\nAlways give value — don't compete only on price!`
        ]
    },

    // FOLLOW UP
    followup: {
        patterns: ['follow up','follow-up','no reply','client not responding','not responding','reminder','check in','remind client','waiting','silence'],
        responses: [
            `📩 **Follow-up Message (Day 2–3)**\n\nHi [Client Name],\n\nJust following up on the website quotation I sent earlier.\n\nI wanted to make sure you received it and to check if you have any questions or changes in requirements.\n\nI'm ready to begin as soon as you confirm — your project will be prioritized!\n\n📎 Quotation: ₹[Amount] | Timeline: [X] days\n\nReply or WhatsApp me anytime 😊\n\nLoganathan M\n📞 [Your Number]`,

            `💬 **WhatsApp Follow-up (Casual)**\n\nHi [Name]! 👋\n\nJust checking in — did you get a chance to look at the website quote I shared?\n\nNo pressure, just wanted to know if you'd like to proceed or have any questions. Happy to adjust the plan!\n\n- Loganathan`
        ]
    },

    // REVIEW REQUEST
    review: {
        patterns: ['review','testimonial','feedback','rating','ask review','request review','get review','5 star','google review'],
        responses: [
            `⭐ **Review Request Message**\n\nHi [Client Name]!\n\nIt was a pleasure working on your website project 🙌\n\nIf you're happy with the result, could you spare 2 minutes to leave a quick review? It truly helps my small business grow.\n\n👉 Review Link: [Your Google Review / Website Link]\n\nEven a short "Great work!" means a lot! 😊\n\nThank you so much,\nLoganathan M`,

            `📱 **WhatsApp Review Request**\n\nHey [Name]! Your website is live 🎉\n\nHope you love it! If you're satisfied, a small Google review would mean the world to me 🙏\n\n⭐ Link: [review link]\n\nThanks a lot! - Loganathan`
        ]
    },

    // SEO
    seo: {
        patterns: ['seo','search engine','google rank','rank','traffic','organic','keyword','meta','backlink','optimize','visibility'],
        responses: [
            `📈 **Top SEO Tips for Your Website Business:**\n\n1. ✅ Add proper Title & Meta Description to every page\n2. ✅ Use keywords like "website developer [city]" / "buy website"\n3. ✅ Create a Google Business Profile (free!)\n4. ✅ Add canonical URL to avoid duplicate content\n5. ✅ Get backlinks from client websites (link to your site)\n6. ✅ Publish useful blog posts (e.g. "How to get a website in 2025")\n7. ✅ Ensure mobile-friendly & fast loading site\n8. ✅ Submit sitemap to Google Search Console\n9. ✅ List on Fiverr, Freelancer, LinkedIn\n10. ✅ Respond to Google reviews — boosts ranking!\n\n💡 Focus on local SEO first: "website developer in [your city]"`,
        ]
    },

    // GET CLIENTS
    clients: {
        patterns: ['get clients','find clients','more clients','new clients','client','how to get','attract','leads','freelance','orders','more orders','grow business','grow'],
        responses: [
            `🚀 **How to Get More Website Clients:**\n\n📱 Social Media:\n• Post your projects on Instagram + LinkedIn daily\n• Use Reels showing before/after website transformations\n• Add "DM for website" in bio\n\n💼 Platforms:\n• Fiverr — great for small orders\n• Freelancer.com — bigger projects\n• LinkedIn — B2B clients\n• WhatsApp groups — local businesses\n\n🏪 Local Approach:\n• Visit local shops, restaurants, clinics\n• Offer "FREE demo website" to attract them\n• Charge for customization & deployment\n\n💡 Pro Tips:\n• Every client = referral opportunity. Ask them!\n• Show live demos, not just screenshots\n• Offer EMI payment for big projects\n• Start cheap → build portfolio → raise prices`,

            `💡 **Client Attraction Formula:**\n\n1. 📸 Post 1 project screenshot daily on Instagram\n2. 💬 Send 10 DMs/day to local businesses\n3. 📋 Offer free 1-page landing page → upsell full site\n4. 🤝 Partner with photographers / designers for referrals\n5. 📞 Follow up every lead — most sales happen on follow-up 3–5\n\n🎯 Target industries: Restaurants, Doctors, Boutiques, Coaching centers, Real estate agents — they all NEED websites!`
        ]
    },

    // WEBSITE TYPES
    websiteTypes: {
        patterns: ['landing page','portfolio','ecommerce','e-commerce','blog','business website','school','restaurant','hospital','doctor','ngo','react','nextjs','html'],
        responses: [
            `🌐 **Website Types & Best Use:**\n\n🔹 Landing Page\n→ Best for: Products, courses, events\n→ Tech: HTML/CSS + Firebase\n→ Price: ₹3,000–₹6,000\n\n🔹 Portfolio\n→ Best for: Freelancers, artists, students\n→ Tech: React / HTML\n→ Price: ₹5,000–₹12,000\n\n🔹 Business Website\n→ Best for: Shops, agencies, firms\n→ Tech: Next.js / React\n→ Price: ₹8,000–₹20,000\n\n🔹 E-Commerce\n→ Best for: Online stores, boutiques\n→ Tech: Next.js + Razorpay/Stripe\n→ Price: ₹15,000–₹40,000\n\n🔹 Web App / Dashboard\n→ Best for: SaaS, admin tools\n→ Tech: React + Firebase\n→ Price: ₹20,000+\n\n💡 Always match tech to client budget!`
        ]
    },

    // PAYMENT
    payment: {
        patterns: ['payment','advance','razorpay','upi','stripe','invoice','payment terms','collect money','deposit','half','50%'],
        responses: [
            `💳 **Payment Terms Best Practices:**\n\n✅ Standard Structure:\n• 50% advance before starting\n• 50% on final delivery / before domain handover\n\n✅ For bigger projects (₹15,000+):\n• 40% advance\n• 30% at midpoint\n• 30% on delivery\n\n📱 Payment Methods:\n• UPI (Google Pay / PhonePe) — easiest\n• Bank Transfer for large amounts\n• Razorpay for international clients\n\n⚠️ NEVER start work without advance — protect yourself!\n\n💡 Add payment terms clearly in your quotation email.`
        ]
    },

    // CONTRACT / AGREEMENT
    contract: {
        patterns: ['contract','agreement','terms','scope','document','client agreement','project scope','protect'],
        responses: [
            `📄 **Simple Client Agreement Points:**\n\n1. Project Scope: Exactly what's included (pages, features)\n2. Timeline: Start date & delivery date\n3. Payment: Amount, schedule & method\n4. Revisions: Max 2–3 free revisions\n5. Content: Client provides content (text, images)\n6. Rights: Client owns final code after full payment\n7. Maintenance: Separate charge after delivery\n\n💡 Send this over WhatsApp as a message or PDF before starting.\nNo legal jargon needed — simple, clear language works best!`
        ]
    },

    // TECH HELP
    tech: {
        patterns: ['firebase','hosting','deploy','domain','ssl','cloudflare','vercel','netlify','github','git','database','firestore','authentication','login'],
        responses: [
            `🛠 **Deployment & Hosting Guide:**\n\n🔥 Firebase Hosting (FREE):\n• Best for HTML/React sites\n• Custom domain support\n• SSL auto-included\n• Deploy: firebase deploy\n\n⚡ Vercel (FREE for hobby):\n• Perfect for Next.js projects\n• Auto deploys from GitHub\n• Blazing fast CDN\n\n🐙 GitHub Pages (FREE):\n• Best for static HTML sites\n• Simple but limited\n\n🌐 Cloudflare (Free tier):\n• Use as DNS + CDN layer\n• Adds security + speed\n\n💡 Recommended Stack:\nNext.js + Vercel + Cloudflare + Firebase Auth/Firestore\n→ Professional, fast, scalable, mostly FREE!`
        ]
    },

    // HOW ARE YOU / IDENTITY
    identity: {
        patterns: ['who are you','what are you','your name','enna peyar','yaar neeyum','ai ya','bot ya','what can you do','help','capabilities'],
        responses: [
            `🤖 I'm your **Business AI Assistant**, trained specifically for:\n\n👤 **Loganathan M** — Web Developer & Website Seller\n🌐 web.loganathan.site\n\n📚 I know about:\n✅ Client emails & quotations\n✅ Pricing packages\n✅ Getting more clients\n✅ SEO strategies\n✅ Website technologies\n✅ Payment & contracts\n✅ Business growth tips\n\nI work 100% offline — no internet or API key needed!\n\nAsk me anything about your web business 🚀`
        ]
    },

    // THANK YOU
    thanks: {
        patterns: ['thank you','thanks','thank','nandri','romba nandri','super','great','nice','awesome','perfect','good'],
        responses: [
            `😊 You're welcome! Happy to help Loganathan M's business grow!\n\nAnything else you need? I'm always here! 🚀`,
            `🙏 Glad I could help! Is there anything else — a quotation, email, or business tip? Just ask!`
        ]
    },

    // ANALYTICS / REPORTS
    analytics: {
        patterns: ['analytics','report','revenue','profit','income','earning','stats','performance','dashboard','how much earned'],
        responses: [
            `📊 **Quick Business Health Check:**\n\n📌 Track these monthly:\n1. Total orders received\n2. Orders completed vs pending\n3. Total revenue collected\n4. New clients added\n5. Reviews / ratings received\n\n🎯 Goals to aim for:\n• ₹20,000+/month → Part-time freelancer target\n• ₹50,000+/month → Full-time freelancer target\n• ₹1,00,000+/month → Agency scale\n\n💡 Check your Admin Dashboard → Analytics tab for real-time charts!\n\nGrow consistently — even 2 projects/month builds momentum.`
        ]
    },

    // DEFAULT
    fallback: [
        `🤔 I didn't quite catch that. Let me suggest some things I can help with:\n\n📧 "Write a quotation email"\n💰 "Suggest pricing for my services"\n📩 "Draft a follow-up message"\n🌟 "Write a review request"\n📈 "SEO tips for my website"\n👥 "How to get more clients"\n🛠 "Firebase hosting help"\n\nTry one of these or rephrase your question!`,
        `💬 I'm not sure about that one, but here's what I'm great at:\n\n→ Client emails & quotations\n→ Pricing packages\n→ Business growth tips\n→ SEO strategies\n→ Tech stack advice\n\nAsk me anything related to your web business!`
    ]
};

// ── Intent Matcher ───────────────────────────────────────────────
function matchAiIntent(input) {
    const text = input.toLowerCase().trim();
    for (const [intent, data] of Object.entries(AI_KB)) {
        if (intent === 'fallback') continue;
        if (data.patterns && data.patterns.some(p => text.includes(p))) {
            return data.responses;
        }
    }
    return null;
}

// ── Context-aware response picker ────────────────────────────────
function pickAiResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
}

// ── Main Local AI Engine ─────────────────────────────────────────
async function localAiReply(message) {
    // Simulate natural thinking delay
    await new Promise(r => setTimeout(r, 250 + Math.random() * 450));

    const lastMsg = aiHistory.length >= 2
        ? aiHistory[aiHistory.length - 2]?.text?.toLowerCase()
        : '';

    const matched = matchAiIntent(message);
    if (matched) return pickAiResponse(matched);

    // Context-aware fallback
    if (lastMsg.includes('quotation') || message.toLowerCase().includes(' for ')) {
        return pickAiResponse(AI_KB.quotation.responses);
    }
    if (lastMsg.includes('client') || message.toLowerCase().includes('client')) {
        return pickAiResponse(AI_KB.clients.responses);
    }

    return pickAiResponse(AI_KB.fallback);
}

// ── UI Helpers ───────────────────────────────────────────────────
function addAiMessage(role, text) {
    const win = document.getElementById('ai-chat-window');
    if (!win) return;
    const welcome = win.querySelector('.ai-welcome');
    if (welcome) welcome.remove();
    const msgEl = document.createElement('div');
    msgEl.className = `ai-msg ${role}`;
    const avatar = role === 'assistant'
        ? `<div class="ai-avatar">✦</div>`
        : `<div class="ai-avatar">LM</div>`;
    // Render **bold** markdown
    const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    msgEl.innerHTML = `${avatar}<div class="ai-bubble">${formatted}</div>`;
    win.appendChild(msgEl);
    win.scrollTop = win.scrollHeight;
}

function addAiTyping() {
    const win = document.getElementById('ai-chat-window');
    if (!win) return;
    const t = document.createElement('div');
    t.className = 'ai-msg assistant';
    t.id = 'ai-typing';
    t.innerHTML = `<div class="ai-avatar">✦</div><div class="ai-typing-indicator"><span></span><span></span><span></span></div>`;
    win.appendChild(t);
    win.scrollTop = win.scrollHeight;
}

function removeAiTyping() {
    const t = document.getElementById('ai-typing');
    if (t) t.remove();
}

// ── Public Handlers ──────────────────────────────────────────────
window.sendAiMessage = async () => {
    const input = document.getElementById('ai-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    input.style.height = 'auto';
    await sendAiPrompt(msg);
};

window.sendAiPrompt = async (message) => {
    const sendBtn = document.getElementById('ai-send-btn');
    addAiMessage('user', message);
    aiHistory.push({ role: 'user', text: message });
    if (sendBtn) sendBtn.disabled = true;
    addAiTyping();
    logActivity('info', `AI: "${message.substring(0, 55)}..."`);
    const reply = await localAiReply(message);
    removeAiTyping();
    addAiMessage('assistant', reply);
    aiHistory.push({ role: 'model', text: reply });
    if (sendBtn) sendBtn.disabled = false;
    logActivity('success', 'AI replied successfully.');
};

window.clearAiChat = async () => {
    const ok = await iosConfirm('Clear Chat', 'All AI conversation history will be cleared.');
    if (!ok) return;
    aiHistory = [];
    const win = document.getElementById('ai-chat-window');
    if (win) win.innerHTML = `<div class="ai-welcome"><div class="ai-welcome-icon">✦</div><h3>Your AI Business Assistant</h3><p>Ask me anything — quotations, emails, pricing, SEO tips, or business ideas!</p></div>`;
    logActivity('info', 'AI chat cleared.');
};

window.handleAiKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window.sendAiMessage(); }
};

// Auto-resize textarea
document.addEventListener('DOMContentLoaded', () => {
    const ta = document.getElementById('ai-input');
    if (ta) ta.addEventListener('input', () => {
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    });

    // Init Invoice date defaults
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0];
    const invDate = document.getElementById('inv-date');
    const invDue = document.getElementById('inv-due');
    if (invDate) { invDate.value = today; renderInvoice(); }
    if (invDue) { invDue.value = due; renderInvoice(); }

    // Init features
    renderKanban();
    renderTasks();
    renderInvoice();
});


// ═══════════════════════════════════════════════════════════════
//  🗂 KANBAN PROJECT BOARD
// ═══════════════════════════════════════════════════════════════
let kanbanProjects = JSON.parse(localStorage.getItem('kb_projects') || '[]');
let draggedKbId = null;

function saveKanban() { localStorage.setItem('kb_projects', JSON.stringify(kanbanProjects)); }

function renderKanban() {
    const cols = ['new', 'progress', 'review', 'done'];
    cols.forEach(col => {
        const container = document.getElementById(`ki-${col}`);
        const counter   = document.getElementById(`kc-${col}`);
        if (!container) return;
        const items = kanbanProjects.filter(p => p.col === col);
        counter.textContent = items.length;
        container.innerHTML = items.length === 0
            ? `<div style="text-align:center;color:#374151;font-size:12px;padding:20px 0;opacity:0.4">Drop here</div>`
            : '';
        items.forEach(p => {
            const card = document.createElement('div');
            card.className = 'kanban-card';
            card.draggable = true;
            card.dataset.id = p.id;
            card.innerHTML = `
                <div class="kb-card-title">${p.title}</div>
                <div class="kb-card-client">👤 ${p.client}</div>
                <div class="kb-card-meta">
                    <span class="kb-card-price">${p.price ? '₹'+p.price : '—'}</span>
                    <span class="kb-card-date">${p.deadline || ''}</span>
                    <button class="kb-card-del" onclick="deleteKbProject('${p.id}')"><i data-lucide="trash-2"></i></button>
                </div>`;
            card.addEventListener('dragstart', () => {
                draggedKbId = p.id;
                setTimeout(() => card.classList.add('dragging'), 0);
            });
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
            container.appendChild(card);
        });
    });
    if (window.lucide) lucide.createIcons();
}

window.onKanbanDrop = (e, col) => {
    e.preventDefault();
    if (!draggedKbId) return;
    const proj = kanbanProjects.find(p => p.id === draggedKbId);
    if (proj) { proj.col = col; saveKanban(); renderKanban(); logActivity('info', `Project "${proj.title}" moved to ${col}.`); }
    draggedKbId = null;
};

window.deleteKbProject = async (id) => {
    const ok = await iosConfirm('Delete Project', 'Remove this project card?');
    if (!ok) return;
    kanbanProjects = kanbanProjects.filter(p => p.id !== id);
    saveKanban(); renderKanban();
    logActivity('warning', 'Project card deleted.');
};

window.openAddProjectModal = () => {
    const overlay = document.createElement('div');
    overlay.className = 'kb-modal-overlay';
    overlay.id = 'kb-modal-overlay';
    overlay.innerHTML = `
        <div class="kb-modal">
            <h3>🗂 New Project Card</h3>
            <div class="kb-modal-field"><label>Project Title</label><input id="kb-title" placeholder="e.g. Portfolio Website for Raja" autofocus></div>
            <div class="kb-modal-field"><label>Client Name</label><input id="kb-client" placeholder="e.g. Raja Kumar"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="kb-modal-field"><label>Budget (₹)</label><input id="kb-price" type="number" placeholder="5000"></div>
                <div class="kb-modal-field"><label>Deadline</label><input id="kb-deadline" type="date"></div>
            </div>
            <div class="kb-modal-field"><label>Stage</label>
                <select id="kb-col">
                    <option value="new">🔵 New Lead</option>
                    <option value="progress">🟡 In Progress</option>
                    <option value="review">🟣 Client Review</option>
                    <option value="done">🟢 Delivered</option>
                </select>
            </div>
            <div class="kb-modal-actions">
                <button class="kb-modal-cancel" onclick="document.getElementById('kb-modal-overlay').remove()">Cancel</button>
                <button class="kb-modal-save" onclick="saveKbProject()">Add Project</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    if (window.lucide) lucide.createIcons();
};

window.saveKbProject = () => {
    const title = document.getElementById('kb-title').value.trim();
    const client = document.getElementById('kb-client').value.trim();
    if (!title) { showToast('Missing Info', 'Please enter a project title.', 'review'); return; }
    const proj = {
        id: Date.now().toString(), title, client: client || 'Unknown Client',
        price: document.getElementById('kb-price').value,
        deadline: document.getElementById('kb-deadline').value,
        col: document.getElementById('kb-col').value
    };
    kanbanProjects.push(proj);
    saveKanban(); renderKanban();
    document.getElementById('kb-modal-overlay').remove();
    showToast('Project Added!', `"${title}" added to board.`, 'success');
    logActivity('success', `Kanban: "${title}" added.`);
};


// ═══════════════════════════════════════════════════════════════
//  🧾 INVOICE GENERATOR
// ═══════════════════════════════════════════════════════════════
let invoiceCounter = parseInt(localStorage.getItem('inv_counter') || '1');
let uploadedQRBase64 = '';

window.togglePaymentQRSection = () => {
    const chk = document.getElementById('inv-enable-qr');
    const config = document.getElementById('inv-qr-config-section');
    if (!chk || !config) return;
    if (chk.checked) {
        config.classList.remove('hide');
    } else {
        config.classList.add('hide');
    }
};

window.handleQRUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedQRBase64 = e.target.result;
        
        // Update upload UI preview
        const text = document.getElementById('inv-qr-upload-text');
        const preview = document.getElementById('inv-qr-upload-preview');
        const removeBtn = document.getElementById('inv-qr-remove-btn');
        
        if (text) text.textContent = 'Scanner QR Code Uploaded!';
        if (preview) {
            preview.src = uploadedQRBase64;
            preview.classList.remove('hide');
        }
        if (removeBtn) removeBtn.classList.remove('hide');
        
        renderInvoice();
        showToast('QR Scanner Uploaded', 'Payment QR image loaded successfully.', 'success');
    };
    reader.readAsDataURL(file);
};

window.removeUploadedQR = () => {
    uploadedQRBase64 = '';
    const fileInput = document.getElementById('inv-qr-upload');
    if (fileInput) fileInput.value = '';
    
    const text = document.getElementById('inv-qr-upload-text');
    const preview = document.getElementById('inv-qr-upload-preview');
    const removeBtn = document.getElementById('inv-qr-remove-btn');
    
    if (text) text.textContent = 'Click to upload QR image';
    if (preview) {
        preview.src = '';
        preview.classList.add('hide');
    }
    if (removeBtn) removeBtn.classList.add('hide');
    
    renderInvoice();
    showToast('QR Scanner Removed', 'Autogenerated QR or no QR will be used.', 'info');
};

window.renderInvoice = () => {
    const client  = document.getElementById('inv-client')?.value || 'Client Name';
    const contact = document.getElementById('inv-contact')?.value || 'contact@email.com';
    const service = document.getElementById('inv-service')?.value || 'Service Description';
    const amount  = parseFloat(document.getElementById('inv-amount')?.value) || 0;
    const currency= document.getElementById('inv-currency')?.value || '₹';
    const date    = document.getElementById('inv-date')?.value || '';
    const due     = document.getElementById('inv-due')?.value || '';
    const status  = document.getElementById('inv-status')?.value || 'pending';
    const notes   = document.getElementById('inv-notes')?.value || '';

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : '—';
    const num = `#LM-${String(invoiceCounter).padStart(3,'0')}`;

    const statusMap = { paid: {icon:'✅', label:'Paid', bg:'rgba(16,185,129,0.15)', color:'#059669'},
                        pending: {icon:'⏳', label:'Pending', bg:'rgba(245,158,11,0.15)', color:'#d97706'},
                        partial: {icon:'💰', label:'Partial', bg:'rgba(99,102,241,0.15)', color:'#6366f1'} };
    const s = statusMap[status];

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };
    set('pv-num', num);
    set('pv-name', client || 'Client Name');
    set('pv-contact', contact || 'contact@email.com');
    set('pv-service', service || 'Service Description');
    set('pv-date', fmt(date));
    set('pv-due', fmt(due));
    set('pv-amount', `${currency}${amount.toLocaleString('en-IN')}`);
    set('pv-total', `${currency}${amount.toLocaleString('en-IN')}`);
    set('pv-notes', notes);

    const badge = document.getElementById('pv-status-badge');
    if (badge) {
        badge.textContent = `${s.icon} ${s.label}`;
        badge.style.background = s.bg;
        badge.style.color = s.color;
    }
    const notesEl = document.getElementById('pv-notes');
    if (notesEl) notesEl.style.display = notes ? 'block' : 'none';

    // ── Payment QR Scanner Logic ──
    const enableQR = document.getElementById('inv-enable-qr')?.checked || false;
    const upiId = document.getElementById('inv-upi-id')?.value.trim() || '';
    const qrContainer = document.getElementById('pv-payment-qr');
    const qrImg = document.getElementById('pv-qr-img');
    const qrSubtext = document.getElementById('pv-qr-subtext');
    const upiDisplay = document.getElementById('pv-upi-display');

    if (qrContainer) {
        if (enableQR) {
            qrContainer.classList.remove('hide');
            if (uploadedQRBase64) {
                if (qrImg) qrImg.src = uploadedQRBase64;
                if (qrSubtext) qrSubtext.textContent = 'Scan the custom uploaded QR code to pay.';
                if (upiDisplay) upiDisplay.textContent = upiId ? `UPI ID: ${upiId}` : '';
            } else if (upiId) {
                // Autogenerate QR Code using free secure API
                const upiUrl = `upi://pay?pa=${upiId}&pn=Loganathan%20M&am=${amount}&cu=${currency === '₹' ? 'INR' : 'USD'}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=8&data=${encodeURIComponent(upiUrl)}`;
                
                if (qrImg) {
                    qrImg.crossOrigin = "anonymous"; // Avoid canvas tainting
                    qrImg.src = qrUrl;
                }
                if (qrSubtext) qrSubtext.textContent = 'Scan with GPay, PhonePe, Paytm, or any UPI app to pay.';
                if (upiDisplay) upiDisplay.textContent = `UPI ID: ${upiId}`;
            } else {
                // QR is enabled but neither upload nor UPI ID is provided. Show a friendly helper placeholder.
                if (qrImg) qrImg.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><rect x='7' y='7' width='3' height='3'/><rect x='14' y='7' width='3' height='3'/><rect x='7' y='14' width='3' height='3'/><path d='M14 14h3v3h-3z'/></svg>";
                if (qrSubtext) qrSubtext.textContent = 'Enter UPI ID or upload scanner QR image.';
                if (upiDisplay) upiDisplay.textContent = '';
            }
        } else {
            qrContainer.classList.add('hide');
        }
    }
};

window.copyInvoice = () => {
    const client  = document.getElementById('inv-client').value || 'Client';
    const contact = document.getElementById('inv-contact').value || '';
    const service = document.getElementById('inv-service').value || 'Service';
    const amount  = document.getElementById('inv-amount').value || '0';
    const currency= document.getElementById('inv-currency').value || '₹';
    const date    = document.getElementById('inv-date').value || '';
    const due     = document.getElementById('inv-due').value || '';
    const status  = document.getElementById('inv-status').value || 'pending';
    const notes   = document.getElementById('inv-notes').value || '';
    const num = `#LM-${String(invoiceCounter).padStart(3,'0')}`;

    const enableQR = document.getElementById('inv-enable-qr')?.checked || false;
    const upiId = document.getElementById('inv-upi-id')?.value.trim() || '';
    let upiText = '';
    if (enableQR && upiId) {
        upiText = `\nUPI PAYMENT ID: ${upiId}`;
    }

    const text = `━━━━━━━━━━━━━━━━━━━━━━
INVOICE ${num}
━━━━━━━━━━━━━━━━━━━━━━
Loganathan M | Web Developer
🌐 web.loganathan.site

BILLED TO:
${client}
${contact}

SERVICE: ${service}
AMOUNT : ${currency}${parseFloat(amount).toLocaleString('en-IN')}
DATE   : ${date}
DUE    : ${due}
STATUS : ${status.toUpperCase()}${upiText}
${notes ? '\nNOTES: ' + notes : ''}
━━━━━━━━━━━━━━━━━━━━━━
Thank you for your business! 🙏`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied!', 'Invoice text copied to clipboard.', 'success');
        invoiceCounter++; localStorage.setItem('inv_counter', invoiceCounter);
        logActivity('success', `Invoice ${num} copied.`);
    });
};

window.downloadInvoice = async () => {
    const preview = document.getElementById('invoice-preview');
    if (!preview) return;

    const client = document.getElementById('inv-client').value.trim() || 'Invoice';
    const num = `LM-${String(invoiceCounter).padStart(3,'0')}`;

    // Show loading overlay
    const loader = document.getElementById('pdf-loading');
    if (loader) { loader.style.display = 'flex'; }

    try {
        // Wait for fonts/images to settle
        await new Promise(r => setTimeout(r, 200));

        const canvas = await html2canvas(preview, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;

        // A4 size in mm
        const pdfW = 210;
        const pdfH = (canvas.height * pdfW) / canvas.width;

        const pdf = new jsPDF({
            orientation: pdfH > pdfW ? 'portrait' : 'landscape',
            unit: 'mm',
            format: [pdfW, pdfH]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
        const fileName = `Invoice_${num}_${client.replace(/\s+/g,'_')}.pdf`;
        pdf.save(fileName);

        // Increment invoice counter
        invoiceCounter++;
        localStorage.setItem('inv_counter', invoiceCounter);
        renderInvoice();

        showToast('PDF Downloaded! 🎉', `Saved as ${fileName}`, 'success');
        logActivity('success', `Invoice ${num} exported as PDF.`);

    } catch (err) {
        console.error('PDF generation failed:', err);
        showToast('Error', 'PDF generation failed. Try again.', 'review');
    } finally {
        if (loader) { loader.style.display = 'none'; }
    }
};


// ═══════════════════════════════════════════════════════════════
//  ✅ TASK MANAGER
// ═══════════════════════════════════════════════════════════════
let tasks = JSON.parse(localStorage.getItem('lm_tasks') || '[]');
let taskFilter = 'all';

function saveTasks() { localStorage.setItem('lm_tasks', JSON.stringify(tasks)); }

function renderTasks() {
    const list = document.getElementById('task-list');
    if (!list) return;

    const filtered = tasks.filter(t => {
        if (taskFilter === 'pending') return !t.done;
        if (taskFilter === 'done')    return t.done;
        if (taskFilter === 'high')    return t.priority === 'high' && !t.done;
        return true;
    });

    const done = tasks.filter(t => t.done).length;
    const pending = tasks.filter(t => !t.done).length;
    const doneEl = document.getElementById('task-count-done');
    const pendEl = document.getElementById('task-count-pending');
    if (doneEl) doneEl.textContent = done;
    if (pendEl) pendEl.textContent = pending;

    if (filtered.length === 0) {
        list.innerHTML = `<div class="task-empty"><span>✅</span>${taskFilter === 'done' ? 'No completed tasks yet.' : 'No tasks here. Add one above!'}</div>`;
        return;
    }

    const priLabels = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };
    const priClass  = { high: 'pri-high', medium: 'pri-medium', low: 'pri-low' };

    list.innerHTML = '';
    filtered.forEach(t => {
        const item = document.createElement('div');
        item.className = `task-item ${t.done ? 'done' : ''}`;
        item.innerHTML = `
            <button class="task-check-btn" onclick="toggleTask('${t.id}')">${t.done ? '✓' : ''}</button>
            <span class="task-text">${t.text}</span>
            <span class="task-priority-badge ${priClass[t.priority]}">${priLabels[t.priority]}</span>
            <button class="task-del-btn" onclick="deleteTask('${t.id}')"><i data-lucide="trash-2"></i></button>`;
        list.appendChild(item);
    });
    if (window.lucide) lucide.createIcons();
}

window.addTask = () => {
    const input = document.getElementById('task-input');
    const priority = document.getElementById('task-priority').value;
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    tasks.unshift({ id: Date.now().toString(), text, priority, done: false, created: new Date().toISOString() });
    saveTasks(); renderTasks(); input.value = '';
    logActivity('info', `Task added: "${text}"`);
};

window.toggleTask = (id) => {
    const t = tasks.find(t => t.id === id);
    if (t) { t.done = !t.done; saveTasks(); renderTasks(); logActivity('success', `Task "${t.text.substring(0,40)}" ${t.done ? 'completed' : 'reopened'}.`); }
};

window.deleteTask = async (id) => {
    const t = tasks.find(t => t.id === id);
    const ok = await iosConfirm('Delete Task', `Remove "${t?.text?.substring(0,40) || 'this task'}"?`);
    if (!ok) return;
    tasks = tasks.filter(t => t.id !== id);
    saveTasks(); renderTasks();
    logActivity('warning', 'Task deleted.');
};

window.filterTasks = (filter, btn) => {
    taskFilter = filter;
    document.querySelectorAll('.task-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTasks();
};

window.clearCompletedTasks = async () => {
    const count = tasks.filter(t => t.done).length;
    if (count === 0) { showToast('Nothing to clear', 'No completed tasks found.', 'review'); return; }
    const ok = await iosConfirm('Clear Done', `Remove ${count} completed task(s)?`);
    if (!ok) return;
    tasks = tasks.filter(t => !t.done);
    saveTasks(); renderTasks();
    showToast('Cleared!', `${count} completed tasks removed.`, 'success');
    logActivity('info', `${count} completed tasks cleared.`);
};
