"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = exports.getStatusColor = exports.formatCurrency = exports.formatDate = void 0;
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};
exports.formatDate = formatDate;
const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
const getStatusColor = (status) => {
    const colors = {
        active: 'green',
        inactive: 'gray',
        suspended: 'red',
        pending: 'yellow',
        paid: 'green',
        overdue: 'red',
        open: 'blue',
        in_progress: 'blue',
        resolved: 'green',
        closed: 'gray',
    };
    return colors[status] || 'gray';
};
exports.getStatusColor = getStatusColor;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
//# sourceMappingURL=index.js.map