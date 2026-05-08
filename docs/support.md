# Support System Guide

This comprehensive guide covers all aspects of the customer support system in HostingCo, including ticket management, knowledge base, customer communication, and support analytics.

## 🎫 Support System Overview

The HostingCo support system provides comprehensive customer service capabilities including ticket management, live chat, knowledge base, and detailed support analytics.

### Core Components
- **Ticket Management** - Multi-channel support ticket system
- **Knowledge Base** - Self-service documentation and FAQs
- **Live Chat** - Real-time customer support
- **Customer Communication** - Email and SMS notifications
- **Support Analytics** - Performance metrics and reporting
- **Escalation Management** - Tiered support escalation

## Ticket Management

### Ticket Creation Workflow

#### Customer-Initiated Tickets
```bash
# Create support ticket via API
POST /api/support/tickets
Authorization: Bearer <user-token>

# Request body
{
  "subject": "Server not responding",
  "description": "My server has been down for 2 hours. I've tried restarting but it won't come back online. The server IP is 192.168.1.101 and it's running Ubuntu 20.04.",
  "priority": "high",
  "category": "technical",
  "serverId": "server_123",
  "attachments": ["attachment_1.jpg", "attachment_2.log"]
}

# Response
{
  "success": true,
  "data": {
    "id": "ticket_456",
    "userId": "user_123",
    "subject": "Server not responding",
    "description": "My server has been down for 2 hours...",
    "status": "open",
    "priority": "high",
    "category": "technical",
    "assignedTo": null,
    "createdAt": "2026-05-08T03:14:24.942Z",
    "ticketNumber": "TKT-2026-001234"
  },
  "message": "Support ticket created successfully"
}
```

#### Admin-Created Tickets
```javascript
// Support ticket service
class SupportTicketService {
  async createTicket(ticketData, createdBy = null) {
    const {
      userId,
      subject,
      description,
      priority = 'medium',
      category = 'general',
      assignedTo = null,
      serverId = null,
      attachments = []
    } = ticketData;
    
    // Generate ticket number
    const ticketNumber = await this.generateTicketNumber();
    
    const ticket = await knex('support_tickets').insert({
      user_id: userId,
      subject,
      description,
      status: 'open',
      priority,
      category,
      assigned_to: assignedTo,
      server_id: serverId,
      ticket_number: ticketNumber,
      created_by: createdBy,
      created_at: new Date()
    }).returning('*');
    
    const createdTicket = ticket[0];
    
    // Add initial message if created by admin
    if (createdBy) {
      await this.addMessage(createdTicket.id, {
        sender: 'support',
        content: `Ticket created by support agent. ${description}`,
        internal: false
      });
    }
    
    // Process attachments
    if (attachments.length > 0) {
      await this.processAttachments(createdTicket.id, attachments);
    }
    
    // Auto-assign based on category and priority
    if (!assignedTo) {
      await this.autoAssignTicket(createdTicket.id, category, priority);
    }
    
    // Send notification to user
    const user = await getUserById(userId);
    await this.sendTicketCreatedNotification(user, createdTicket);
    
    // Log ticket creation
    await logActivity({
      userId: createdBy,
      action: 'ticket_created',
      resource: 'support_ticket',
      resourceId: createdTicket.id,
      details: {
        ticketNumber: createdTicket.ticket_number,
        subject,
        priority,
        category
      }
    });
    
    return createdTicket;
  }
  
  async generateTicketNumber() {
    const year = new Date().getFullYear();
    const prefix = `TKT-${year}`;
    
    // Get the last ticket number for this year
    const lastTicket = await knex('support_tickets')
      .where('ticket_number', 'like', `${prefix}%`)
      .orderBy('ticket_number', 'desc')
      .first();
    
    let nextNumber = 1;
    
    if (lastTicket) {
      const lastNumber = parseInt(lastTicket.ticket_number.split('-')[2]);
      nextNumber = lastNumber + 1;
    }
    
    return `${prefix}-${nextNumber.toString().padStart(6, '0')}`;
  }
}
```

### Ticket Status Management

#### Status Workflow
```javascript
// Ticket status transitions
const TICKET_STATUS_TRANSITIONS = {
  open: ['in_progress', 'resolved', 'closed'],
  in_progress: ['resolved', 'closed', 'pending_customer'],
  pending_customer: ['in_progress', 'resolved', 'closed'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in_progress', 'closed']
};

// Update ticket status
const updateTicketStatus = async (ticketId, newStatus, updatedBy, reason = null) => {
  const ticket = await getTicketById(ticketId);
  
  // Validate status transition
  const validTransitions = TICKET_STATUS_TRANSITIONS[ticket.status];
  if (!validTransitions.includes(newStatus)) {
    throw new Error(`Cannot transition from ${ticket.status} to ${newStatus}`);
  }
  
  const updateData = {
    status: newStatus,
    updated_at: new Date()
  };
  
  // Add resolution details if resolving
  if (newStatus === 'resolved') {
    updateData.resolved_at = new Date();
    updateData.resolved_by = updatedBy;
  }
  
  // Add closure details if closing
  if (newStatus === 'closed') {
    updateData.closed_at = new Date();
    updateData.closed_by = updatedBy;
  }
  
  await knex('support_tickets')
    .where({ id: ticketId })
    .update(updateData);
  
  // Add status change message
  await this.addMessage(ticketId, {
    sender: 'support',
    content: `Status changed from ${ticket.status} to ${newStatus}${reason ? `. Reason: ${reason}` : ''}`,
    internal: false
  });
  
  // Log status change
  await logActivity({
    userId: updatedBy,
    action: 'ticket_status_changed',
    resource: 'support_ticket',
    resourceId: ticketId,
    details: {
      oldStatus: ticket.status,
      newStatus,
      reason
    }
  });
  
  // Send notifications
  await this.handleTicketStatusChange(ticket, newStatus, reason);
  
  return await getTicketById(ticketId);
};
```

### Ticket Assignment and Escalation

#### Auto-Assignment Logic
```javascript
// Ticket assignment service
class TicketAssignmentService {
  async autoAssignTicket(ticketId, category, priority) {
    const assignmentRules = await this.getAssignmentRules(category, priority);
    
    for (const rule of assignmentRules) {
      const availableAgent = await this.findAvailableAgent(rule);
      
      if (availableAgent) {
        await this.assignTicket(ticketId, availableAgent.id, 'auto_assigned');
        return availableAgent;
      }
    }
    
    // If no agent available, assign to queue
    await this.assignToQueue(ticketId, category, priority);
    return null;
  }
  
  async findAvailableAgent(rule) {
    const agents = await knex('support_agents')
      .where('is_active', true)
      .where('current_tickets', '<', 'max_tickets')
      .whereJsonPath('categories', '$', '@>', `"${rule.category}"`)
      .whereJsonPath('skills', '$', '@>', `"${rule.skill}"`)
      .orderBy('performance_score', 'desc');
    
    // Check agent availability
    for (const agent of agents) {
      const isAvailable = await this.checkAgentAvailability(agent.id);
      if (isAvailable) {
        return agent;
      }
    }
    
    return null;
  }
  
  async assignTicket(ticketId, agentId, assignmentType = 'manual') {
    const ticket = await getTicketById(ticketId);
    const agent = await getSupportAgent(agentId);
    
    await knex.transaction(async (trx) => {
      // Update ticket assignment
      await trx('support_tickets')
        .where({ id: ticketId })
        .update({
          assigned_to: agentId,
          status: 'in_progress',
          assigned_at: new Date(),
          updated_at: new Date()
        });
      
      // Update agent ticket count
      await trx('support_agents')
        .where({ id: agentId })
        .increment('current_tickets', 1);
      
      // Add assignment message
      await this.addMessage(ticketId, {
        sender: 'support',
        content: `Ticket assigned to ${agent.name} (${assignmentType})`,
        internal: true
      });
    });
    
    // Send notification to agent
    await this.notifyAgentAssignment(agent, ticket);
    
    // Log assignment
    await logActivity({
      userId: agentId,
      action: 'ticket_assigned',
      resource: 'support_ticket',
      resourceId: ticketId,
      details: {
        assignmentType,
        ticketNumber: ticket.ticket_number
      }
    });
    
    return await getTicketById(ticketId);
  }
  
  async escalateTicket(ticketId, escalationLevel, reason) {
    const ticket = await getTicketById(ticketId);
    const escalationRules = await this.getEscalationRules(escalationLevel);
    
    // Find escalation target
    const escalationTarget = await this.findEscalationTarget(escalationRules);
    
    if (!escalationTarget) {
      throw new Error('No escalation target available');
    }
    
    await knex.transaction(async (trx) => {
      // Update ticket
      await trx('support_tickets')
        .where({ id: ticketId })
        .update({
          assigned_to: escalationTarget.id,
          escalation_level: escalationLevel,
          escalated_at: new Date(),
          escalation_reason: reason,
          priority: this.increasePriority(ticket.priority, escalationLevel),
          updated_at: new Date()
        });
      
      // Add escalation message
      await this.addMessage(ticketId, {
        sender: 'support',
        content: `Ticket escalated to level ${escalationLevel}. Reason: ${reason}`,
        internal: true
      });
    });
    
    // Send escalation notification
    await this.notifyEscalation(escalationTarget, ticket, reason);
    
    return await getTicketById(ticketId);
  }
}
```

## Message Management

### Ticket Messages

#### Message Types and Handling
```javascript
// Message management service
class MessageService {
  async addMessage(ticketId, messageData) {
    const {
      sender, // 'user' or 'support'
      content,
      internal = false,
      attachments = [],
      replyTo = null
    } = messageData;
    
    const ticket = await getTicketById(ticketId);
    
    // Validate message permissions
    if (sender === 'user' && ticket.status === 'closed') {
      throw new Error('Cannot add message to closed ticket');
    }
    
    const message = await knex('ticket_messages').insert({
      ticket_id: ticketId,
      sender,
      content,
      internal,
      reply_to: replyTo,
      created_at: new Date()
    }).returning('*');
    
    const createdMessage = message[0];
    
    // Process attachments
    if (attachments.length > 0) {
      await this.processMessageAttachments(createdMessage.id, attachments);
    }
    
    // Update ticket activity
    await knex('support_tickets')
      .where({ id: ticketId })
      .update({
        last_activity: new Date(),
        updated_at: new Date()
      });
    
    // Update ticket status based on message
    if (sender === 'user' && ticket.status === 'pending_customer') {
      await updateTicketStatus(ticketId, 'in_progress', 'system', 'Customer responded');
    }
    
    // Send notifications
    await this.handleMessageNotification(ticket, createdMessage);
    
    // Log message
    await logActivity({
      userId: sender === 'user' ? ticket.user_id : null,
      action: 'ticket_message_added',
      resource: 'support_ticket',
      resourceId: ticketId,
      details: {
        messageId: createdMessage.id,
        sender,
        internal,
        hasAttachments: attachments.length > 0
      }
    });
    
    return createdMessage;
  }
  
  async processMessageAttachments(messageId, attachments) {
    for (const attachment of attachments) {
      await knex('message_attachments').insert({
        message_id: messageId,
        filename: attachment.filename,
        file_path: attachment.filePath,
        file_size: attachment.fileSize,
        mime_type: attachment.mimeType,
        uploaded_at: new Date()
      });
    }
  }
  
  async getMessageHistory(ticketId, includeInternal = false) {
    const query = knex('ticket_messages')
      .where('ticket_id', ticketId)
      .orderBy('created_at', 'asc');
    
    if (!includeInternal) {
      query.where('internal', false);
    }
    
    const messages = await query;
    
    // Attach attachments to messages
    for (const message of messages) {
      message.attachments = await knex('message_attachments')
        .where('message_id', message.id);
    }
    
    return messages;
  }
}
```

### Rich Message Features

#### Message Formatting and Templates
```javascript
// Message formatting service
class MessageFormattingService {
  async formatMessage(content, type = 'plain') {
    switch (type) {
      case 'html':
        return this.formatHtmlMessage(content);
      case 'markdown':
        return this.formatMarkdownMessage(content);
      case 'plain':
      default:
        return this.formatPlainMessage(content);
    }
  }
  
  formatHtmlMessage(content) {
    // Sanitize HTML content
    const sanitized = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'code', 'pre'],
      ALLOWED_ATTR: ['href', 'target', 'class'],
      ALLOW_DATA_ATTR: false
    });
    
    return sanitized;
  }
  
  formatMarkdownMessage(content) {
    // Convert markdown to HTML
    const html = marked(content);
    return this.formatHtmlMessage(html);
  }
  
  formatPlainMessage(content) {
    // Convert plain text to basic HTML
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }
  
  async useMessageTemplate(templateId, variables = {}) {
    const template = await knex('message_templates')
      .where('id', templateId)
      .first();
    
    if (!template) {
      throw new Error('Message template not found');
    }
    
    // Replace variables in template
    let content = template.content;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, value);
    }
    
    return {
      subject: template.subject.replace(/{{\s*(\w+)\s*}}/g, (match, key) => variables[key] || match),
      content: await this.formatMessage(content, template.format)
    };
  }
}
```

## 🤖 Knowledge Base Management

### Article Management

#### Knowledge Base Articles
```javascript
// Knowledge base service
class KnowledgeBaseService {
  async createArticle(articleData) {
    const {
      title,
      content,
      category,
      tags = [],
      isPublic = true,
      authorId,
      attachments = []
    } = articleData;
    
    const article = await knex('knowledge_base_articles').insert({
      title,
      content,
      category,
      tags: JSON.stringify(tags),
      is_public: isPublic,
      author_id: authorId,
      status: 'published',
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');
    
    const createdArticle = article[0];
    
    // Process attachments
    if (attachments.length > 0) {
      await this.processArticleAttachments(createdArticle.id, attachments);
    }
    
    // Index for search
    await this.indexArticle(createdArticle);
    
    // Log article creation
    await logActivity({
      userId: authorId,
      action: 'kb_article_created',
      resource: 'knowledge_base',
      resourceId: createdArticle.id,
      details: {
        title,
        category,
        isPublic
      }
    });
    
    return createdArticle;
  }
  
  async searchArticles(query, filters = {}) {
    const {
      category,
      tags = [],
      isPublic = true,
      limit = 20,
      offset = 0
    } = filters;
    
    let searchQuery = knex('knowledge_base_articles')
      .where('status', 'published')
      .where('is_public', isPublic);
    
    // Add text search
    if (query) {
      searchQuery.where(function() {
        this.where('title', 'ILIKE', `%${query}%`)
          .orWhere('content', 'ILIKE', `%${query}%`)
          .orWhere('tags', 'ILIKE', `%${query}%`);
      });
    }
    
    // Add category filter
    if (category) {
      searchQuery.where('category', category);
    }
    
    // Add tags filter
    if (tags.length > 0) {
      searchQuery.where(function() {
        for (const tag of tags) {
          this.orWhere('tags', 'ILIKE', `%${tag}%`);
        }
      });
    }
    
    // Order by relevance
    searchQuery.orderRaw(`
      CASE 
        WHEN title ILIKE ? THEN 1
        WHEN title ILIKE ? THEN 2
        WHEN content ILIKE ? THEN 3
        ELSE 4
      END
    `, [`${query}`, `%${query}%`, `%${query}%`]);
    
    const articles = await searchQuery
      .limit(limit)
      .offset(offset);
    
    // Add search highlights
    for (const article of articles) {
      article.highlights = this.generateSearchHighlights(article.content, query);
    }
    
    return articles;
  }
  
  generateSearchHighlights(content, query) {
    const words = query.split(' ');
    const highlights = [];
    
    for (const word of words) {
      const regex = new RegExp(`(${word})`, 'gi');
      const matches = content.match(regex);
      
      if (matches) {
        const index = content.toLowerCase().indexOf(word.toLowerCase());
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + word.length + 50);
        const snippet = content.substring(start, end);
        
        highlights.push(snippet.replace(regex, '<mark>$1</mark>'));
      }
    }
    
    return highlights.slice(0, 3); // Return top 3 highlights
  }
}
```

#### Article Categories and Tags
```javascript
// Category management
class CategoryService {
  async getCategories() {
    return await knex('kb_categories')
      .where('is_active', true)
      .orderBy('name');
  }
  
  async getCategoryStats(categoryId) {
    const stats = await knex('knowledge_base_articles')
      .where('category', categoryId)
      .where('status', 'published')
      .select(
        knex.raw('COUNT(*) as total_articles'),
        knex.raw('AVG(view_count) as avg_views'),
        knex.raw('AVG(rating) as avg_rating')
      )
      .first();
    
    return stats;
  }
  
  async getPopularTags(limit = 50) {
    return await knex('knowledge_base_articles')
      .where('status', 'published')
      .where('is_public', true)
      .select('tags')
      .then(articles => {
        const tagCounts = {};
        
        articles.forEach(article => {
          const tags = JSON.parse(article.tags);
          tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });
        
        return Object.entries(tagCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, limit)
          .map(([tag, count]) => ({ tag, count }));
      });
  }
}
```

## Live Chat Support

### Chat System Implementation

#### Real-time Chat Service
```javascript
// Live chat service
class LiveChatService {
  constructor(io) {
    this.io = io;
    this.activeChats = new Map();
    this.agentChats = new Map();
    
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Chat client connected:', socket.id);
      
      socket.on('start_chat', async (data) => {
        await this.handleStartChat(socket, data);
      });
      
      socket.on('chat_message', async (data) => {
        await this.handleChatMessage(socket, data);
      });
      
      socket.on('end_chat', async (data) => {
        await this.handleEndChat(socket, data);
      });
      
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }
  
  async handleStartChat(socket, data) {
    const { userId, category, priority = 'medium' } = data;
    
    // Find available agent
    const agent = await this.findAvailableAgent(category, priority);
    
    if (!agent) {
      socket.emit('chat_unavailable', {
        message: 'No agents available at the moment. Please try again later or create a support ticket.',
        suggestedActions: ['create_ticket', 'schedule_callback']
      });
      return;
    }
    
    // Create chat session
    const chatSession = await this.createChatSession(userId, agent.id, category, priority);
    
    // Join chat room
    socket.join(`chat_${chatSession.id}`);
    
    // Get agent socket
    const agentSocket = this.getAgentSocket(agent.id);
    if (agentSocket) {
      agentSocket.join(`chat_${chatSession.id}`);
      agentSocket.emit('new_chat', {
        chatId: chatSession.id,
        userId,
        category,
        priority
      });
    }
    
    // Store session
    this.activeChats.set(chatSession.id, {
      id: chatSession.id,
      userId,
      agentId: agent.id,
      category,
      priority,
      startedAt: new Date(),
      userSocket: socket.id,
      agentSocket: agentSocket?.id
    });
    
    // Notify user
    socket.emit('chat_started', {
      chatId: chatSession.id,
      agent: {
        name: agent.name,
        avatar: agent.avatar
      }
    });
  }
  
  async handleChatMessage(socket, data) {
    const { chatId, message, sender } = data;
    
    const chatSession = this.activeChats.get(chatId);
    if (!chatSession) {
      socket.emit('error', { message: 'Chat session not found' });
      return;
    }
    
    // Save message
    const savedMessage = await this.saveChatMessage(chatId, sender, message);
    
    // Broadcast to chat room
    this.io.to(`chat_${chatId}`).emit('chat_message', {
      id: savedMessage.id,
      chatId,
      sender,
      message,
      timestamp: savedMessage.created_at
    });
    
    // Update last activity
    chatSession.lastActivity = new Date();
    
    // Check for auto-responses
    if (sender === 'user') {
      const autoResponse = await this.checkAutoResponse(message, chatSession.category);
      if (autoResponse) {
        setTimeout(() => {
          this.handleChatMessage(socket, {
            chatId,
            message: autoResponse,
            sender: 'bot'
          });
        }, 1000);
      }
    }
  }
  
  async findAvailableAgent(category, priority) {
    const agents = await knex('support_agents')
      .where('is_active', true)
      .where('is_available', true)
      .whereJsonPath('categories', '$', '@>', `"${category}"`)
      .where('current_chats', '<', 'max_chats')
      .orderBy('performance_score', 'desc');
    
    return agents[0] || null;
  }
  
  async createChatSession(userId, agentId, category, priority) {
    const session = await knex('chat_sessions').insert({
      user_id: userId,
      agent_id: agentId,
      category,
      priority,
      status: 'active',
      started_at: new Date()
    }).returning('*');
    
    // Update agent chat count
    await knex('support_agents')
      .where('id', agentId)
      .increment('current_chats', 1);
    
    return session[0];
  }
}
```

#### Chat Analytics and Monitoring
```javascript
// Chat analytics service
class ChatAnalyticsService {
  async getChatAnalytics(period = '24h') {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(endDate.getHours() - parseInt(period));
    
    const analytics = {
      overview: await this.getChatOverview(startDate, endDate),
      agentPerformance: await this.getAgentPerformance(startDate, endDate),
      categoryBreakdown: await this.getCategoryBreakdown(startDate, endDate),
      responseTime: await this.getResponseTimeMetrics(startDate, endDate),
      satisfaction: await this.getSatisfactionMetrics(startDate, endDate)
    };
    
    return analytics;
  }
  
  async getChatOverview(startDate, endDate) {
    const [totalChats, activeChats, completedChats, averageDuration] = await Promise.all([
      knex('chat_sessions')
        .whereBetween('started_at', [startDate, endDate])
        .count('* as total')
        .first(),
      
      knex('chat_sessions')
        .where('status', 'active')
        .count('* as active')
        .first(),
      
      knex('chat_sessions')
        .whereBetween('started_at', [startDate, endDate])
        .where('status', 'completed')
        .count('* as completed')
        .first(),
      
      knex('chat_sessions')
        .whereBetween('started_at', [startDate, endDate])
        .where('status', 'completed')
        .avg(knex.raw('EXTRACT(EPOCH FROM (ended_at - started_at)) / 60 as duration'))
        .first()
    ]);
    
    return {
      total: totalChats.total,
      active: activeChats.active,
      completed: completedChats.completed,
      averageDuration: parseFloat(averageDuration.duration || 0).toFixed(2),
      completionRate: ((completedChats.completed / totalChats.total) * 100).toFixed(2)
    };
  }
  
  async getAgentPerformance(startDate, endDate) {
    return await knex('chat_sessions as cs')
      .join('support_agents as sa', 'cs.agent_id', 'sa.id')
      .whereBetween('cs.started_at', [startDate, endDate])
      .select(
        'sa.name',
        'sa.id',
        knex.raw('COUNT(*) as total_chats'),
        knex.raw('AVG(EXTRACT(EPOCH FROM (cs.ended_at - cs.started_at)) / 60) as avg_duration'),
        knex.raw('AVG(cs.satisfaction_rating) as avg_rating'),
        knex.raw('COUNT(CASE WHEN cs.status = "completed" THEN 1 END) as completed_chats')
      )
      .groupBy('sa.id', 'sa.name')
      .orderBy('avg_rating', 'desc');
  }
}
```

## 📧 Customer Communication

### Email Templates and Automation

#### Support Email Templates
```javascript
// Email notification service
class SupportEmailService {
  async sendTicketCreatedNotification(user, ticket) {
    const template = 'ticket-created';
    const subject = `Support Ticket Created: ${ticket.ticket_number}`;
    
    await emailService.send({
      to: user.email,
      subject,
      template,
      data: {
        userName: user.name,
        ticketNumber: ticket.ticket_number,
        ticketSubject: ticket.subject,
        ticketCategory: ticket.category,
        priority: ticket.priority,
        ticketUrl: `${process.env.FRONTEND_URL}/support/tickets/${ticket.id}`,
        supportEmail: 'support@hostingco.com'
      }
    });
  }
  
  async sendTicketAssignedNotification(user, ticket, agent) {
    const template = 'ticket-assigned';
    const subject = `Support Ticket Assigned: ${ticket.ticket_number}`;
    
    await emailService.send({
      to: user.email,
      subject,
      template,
      data: {
        userName: user.name,
        ticketNumber: ticket.ticket_number,
        agentName: agent.name,
        agentAvatar: agent.avatar,
        ticketUrl: `${process.env.FRONTEND_URL}/support/tickets/${ticket.id}`,
        estimatedResponseTime: this.getEstimatedResponseTime(ticket.priority)
      }
    });
  }
  
  async sendTicketResolvedNotification(user, ticket, resolution) {
    const template = 'ticket-resolved';
    const subject = `Support Ticket Resolved: ${ticket.ticket_number}`;
    
    await emailService.send({
      to: user.email,
      subject,
      template,
      data: {
        userName: user.name,
        ticketNumber: ticket.ticket_number,
        ticketSubject: ticket.subject,
        resolution,
        resolvedAt: new Date(ticket.resolved_at).toLocaleString(),
        satisfactionSurveyUrl: `${process.env.FRONTEND_URL}/support/survey/${ticket.id}`
      }
    });
  }
  
  async sendEscalationNotification(user, ticket, escalationLevel, reason) {
    const template = 'ticket-escalated';
    const subject = `Support Ticket Escalated: ${ticket.ticket_number}`;
    
    await emailService.send({
      to: user.email,
      subject,
      template,
      data: {
        userName: user.name,
        ticketNumber: ticket.ticket_number,
        escalationLevel,
        reason,
        ticketUrl: `${process.env.FRONTEND_URL}/support/tickets/${ticket.id}`,
        supportEmail: 'support@hostingco.com'
      }
    });
  }
  
  getEstimatedResponseTime(priority) {
    const responseTimes = {
      low: '24 hours',
      medium: '8 hours',
      high: '2 hours',
      urgent: '30 minutes'
    };
    
    return responseTimes[priority] || '8 hours';
  }
}
```

### SMS Notifications

#### SMS Integration
```javascript
// SMS notification service
class SMSService {
  async sendSMSNotification(phoneNumber, message, type = 'notification') {
    try {
      const response = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      
      // Log SMS sent
      await knex('sms_logs').insert({
        phone_number: phoneNumber,
        message,
        type,
        twilio_message_id: response.sid,
        status: 'sent',
        sent_at: new Date()
      });
      
      return { success: true, messageId: response.sid };
    } catch (error) {
      // Log SMS error
      await knex('sms_logs').insert({
        phone_number: phoneNumber,
        message,
        type,
        error_message: error.message,
        status: 'failed',
        sent_at: new Date()
      });
      
      throw error;
    }
  }
  
  async sendTicketUrgentNotification(user, ticket) {
    if (ticket.priority === 'urgent' && user.phone) {
      const message = `HostingCo: Urgent support ticket ${ticket.ticket_number} has been created. We'll respond within 30 minutes. Reply STOP to unsubscribe.`;
      
      await this.sendSMSNotification(user.phone, message, 'urgent_ticket');
    }
  }
  
  async sendTicketResolvedSMS(user, ticket) {
    if (user.phone && user.sms_notifications) {
      const message = `HostingCo: Your support ticket ${ticket.ticket_number} has been resolved. View details: ${process.env.FRONTEND_URL}/support/tickets/${ticket.id}`;
      
      await this.sendSMSNotification(user.phone, message, 'ticket_resolved');
    }
  }
}
```

## Support Analytics

### Performance Metrics

#### Support Dashboard Analytics
```javascript
// Support analytics service
class SupportAnalyticsService {
  async getSupportDashboard(period = '30d') {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));
    
    const dashboard = {
      overview: await this.getSupportOverview(startDate, endDate),
      ticketMetrics: await this.getTicketMetrics(startDate, endDate),
      agentPerformance: await this.getAgentPerformance(startDate, endDate),
      customerSatisfaction: await this.getCustomerSatisfaction(startDate, endDate),
      responseTimeMetrics: await this.getResponseTimeMetrics(startDate, endDate),
      categoryAnalytics: await this.getCategoryAnalytics(startDate, endDate)
    };
    
    return dashboard;
  }
  
  async getSupportOverview(startDate, endDate) {
    const [totalTickets, openTickets, resolvedTickets, escalatedTickets] = await Promise.all([
      knex('support_tickets')
        .whereBetween('created_at', [startDate, endDate])
        .count('* as total')
        .first(),
      
      knex('support_tickets')
        .where('status', 'in', ['open', 'in_progress'])
        .count('* as open')
        .first(),
      
      knex('support_tickets')
        .whereBetween('created_at', [startDate, endDate])
        .where('status', 'resolved')
        .count('* as resolved')
        .first(),
      
      knex('support_tickets')
        .whereBetween('created_at', [startDate, endDate])
        .whereNotNull('escalation_level')
        .count('* as escalated')
        .first()
    ]);
    
    return {
      total: totalTickets.total,
      open: openTickets.open,
      resolved: resolvedTickets.resolved,
      escalated: escalatedTickets.escalated,
      resolutionRate: ((resolvedTickets.resolved / totalTickets.total) * 100).toFixed(2),
      escalationRate: ((escalatedTickets.escalated / totalTickets.total) * 100).toFixed(2)
    };
  }
  
  async getResponseTimeMetrics(startDate, endDate) {
    return await knex('support_tickets')
      .whereBetween('created_at', [startDate, endDate])
      .whereNotNull('first_response_at')
      .select(
        knex.raw('AVG(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 60) as avg_response_time'),
        knex.raw('MIN(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 60) as min_response_time'),
        knex.raw('MAX(EXTRACT(EPOCH FROM (first_response_at - created_at)) / 60) as max_response_time'),
        knex.raw('PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_response_at - created_at)) / 60) as median_response_time')
      )
      .first();
  }
  
  async getCategoryAnalytics(startDate, endDate) {
    return await knex('support_tickets')
      .whereBetween('created_at', [startDate, endDate])
      .select('category')
      .select(knex.raw('COUNT(*) as total'))
      .select(knex.raw('COUNT(CASE WHEN status = "resolved" THEN 1 END) as resolved'))
      .select(knex.raw('AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_resolution_hours'))
      .groupBy('category')
      .orderBy('total', 'desc');
  }
}
```

### Satisfaction Surveys

#### Customer Satisfaction System
```javascript
// Satisfaction survey service
class SatisfactionSurveyService {
  async createSurvey(ticketId) {
    const ticket = await getTicketById(ticketId);
    
    if (ticket.status !== 'resolved') {
      throw new Error('Surveys can only be created for resolved tickets');
    }
    
    // Check if survey already exists
    const existingSurvey = await knex('satisfaction_surveys')
      .where('ticket_id', ticketId)
      .first();
    
    if (existingSurvey) {
      return existingSurvey;
    }
    
    const survey = await knex('satisfaction_surveys').insert({
      ticket_id: ticketId,
      user_id: ticket.user_id,
      status: 'pending',
      created_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }).returning('*');
    
    // Send survey notification
    const user = await getUserById(ticket.user_id);
    await this.sendSurveyNotification(user, survey[0]);
    
    return survey[0];
  }
  
  async submitSurveyResponse(surveyId, responseData) {
    const {
      rating,
      feedback,
      categories = {},
      recommendations = {}
    } = responseData;
    
    const survey = await knex('satisfaction_surveys')
      .where('id', surveyId)
      .where('status', 'pending')
      .first();
    
    if (!survey) {
      throw new Error('Survey not found or already completed');
    }
    
    await knex.transaction(async (trx) => {
      // Update survey
      await trx('satisfaction_surveys')
        .where('id', surveyId)
        .update({
          status: 'completed',
          rating,
          feedback,
          categories: JSON.stringify(categories),
          recommendations: JSON.stringify(recommendations),
          responded_at: new Date()
        });
      
      // Update agent performance
      const ticket = await getTicketById(survey.ticket_id);
      if (ticket.assigned_to) {
        await this.updateAgentPerformance(ticket.assigned_to, rating);
      }
      
      // Log survey response
      await logActivity({
        userId: survey.user_id,
        action: 'satisfaction_survey_completed',
        resource: 'support_ticket',
        resourceId: survey.ticket_id,
        details: {
          surveyId,
          rating,
          hasFeedback: !!feedback
        }
      });
    });
    
    return await knex('satisfaction_surveys')
      .where('id', surveyId)
      .first();
  }
  
  async updateAgentPerformance(agentId, rating) {
    const agent = await getSupportAgent(agentId);
    
    // Update performance metrics
    const newRating = (agent.performance_score * agent.total_ratings + rating) / (agent.total_ratings + 1);
    
    await knex('support_agents')
      .where('id', agentId)
      .update({
        performance_score: newRating,
        total_ratings: agent.total_ratings + 1,
        last_rating: rating,
        last_rating_at: new Date()
      });
  }
}
```

## Support Tools and Automation

### Automated Responses

#### AI-Powered Suggestions
```javascript
// Automated response service
class AutomatedResponseService {
  async generateResponse(ticketId, message) {
    const ticket = await getTicketById(ticketId);
    const category = ticket.category;
    
    // Check knowledge base for relevant articles
    const kbArticles = await this.searchKnowledgeBase(message, category);
    
    // Check for common responses
    const commonResponse = await this.findCommonResponse(message, category);
    
    // Generate AI response if available
    const aiResponse = await this.generateAIResponse(message, ticket);
    
    return {
      kbArticles,
      commonResponse,
      aiResponse,
      suggestedActions: await this.suggestActions(ticket, message)
    };
  }
  
  async searchKnowledgeBase(query, category) {
    const searchResults = await knowledgeBaseService.searchArticles(query, {
      category,
      limit: 5
    });
    
    return searchResults.map(article => ({
      id: article.id,
      title: article.title,
      summary: this.generateSummary(article.content),
      url: `${process.env.FRONTEND_URL}/kb/articles/${article.id}`,
      relevance: this.calculateRelevance(article, query)
    }));
  }
  
  async findCommonResponse(message, category) {
    const commonResponses = await knex('common_responses')
      .where('category', category)
      .where('is_active', true);
    
    for (const response of commonResponses) {
      const keywords = JSON.parse(response.keywords);
      const matchCount = keywords.filter(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      
      if (matchCount >= keywords.length * 0.7) { // 70% keyword match
        return {
          id: response.id,
          response: response.response,
          confidence: matchCount / keywords.length
        };
      }
    }
    
    return null;
  }
  
  async suggestActions(ticket, message) {
    const actions = [];
    
    // Check if server restart is suggested
    if (message.toLowerCase().includes('restart') || message.toLowerCase().includes('reboot')) {
      actions.push({
        type: 'server_action',
        action: 'restart',
        description: 'Restart server',
        serverId: ticket.server_id
      });
    }
    
    // Check if password reset is suggested
    if (message.toLowerCase().includes('password') || message.toLowerCase().includes('login')) {
      actions.push({
        type: 'user_action',
        action: 'password_reset',
        description: 'Send password reset link',
        userId: ticket.user_id
      });
    }
    
    // Check if escalation is suggested
    if (message.toLowerCase().includes('urgent') || message.toLowerCase().includes('emergency')) {
      actions.push({
        type: 'escalation',
        action: 'escalate',
        description: 'Escalate to senior support'
      });
    }
    
    return actions;
  }
}
```

### Support Automation Rules

#### Rule Engine
```javascript
// Support automation engine
class SupportAutomationEngine {
  async processTicketCreated(ticket) {
    const rules = await this.getApplicableRules('ticket_created', ticket);
    
    for (const rule of rules) {
      await this.executeRule(rule, ticket);
    }
  }
  
  async getApplicableRules(eventType, context) {
    return await knex('automation_rules')
      .where('event_type', eventType)
      .where('is_active', true)
      .orderBy('priority', 'desc');
  }
  
  async executeRule(rule, context) {
    const conditions = JSON.parse(rule.conditions);
    
    if (this.evaluateConditions(conditions, context)) {
      const actions = JSON.parse(rule.actions);
      
      for (const action of actions) {
        await this.executeAction(action, context);
      }
    }
  }
  
  evaluateConditions(conditions, context) {
    for (const condition of conditions) {
      const { field, operator, value } = condition;
      const contextValue = this.getFieldValue(context, field);
      
      if (!this.evaluateCondition(contextValue, operator, value)) {
        return false;
      }
    }
    
    return true;
  }
  
  evaluateCondition(contextValue, operator, value) {
    switch (operator) {
      case 'equals':
        return contextValue === value;
      case 'contains':
        return contextValue.includes(value);
      case 'greater_than':
        return contextValue > value;
      case 'less_than':
        return contextValue < value;
      case 'in':
        return value.includes(contextValue);
      default:
        return false;
    }
  }
  
  async executeAction(action, context) {
    switch (action.type) {
      case 'assign_to_agent':
        await this.assignToAgent(context.id, action.agent_id);
        break;
        
      case 'send_notification':
        await this.sendNotification(action.recipient, action.message, action.channel);
        break;
        
      case 'escalate':
        await this.escalateTicket(context.id, action.level, action.reason);
        break;
        
      case 'add_tag':
        await this.addTicketTag(context.id, action.tag);
        break;
        
      case 'set_priority':
        await this.setTicketPriority(context.id, action.priority);
        break;
        
      case 'create_follow_up':
        await this.createFollowUpTicket(context.id, action.delay);
        break;
    }
  }
}
```

## Support Procedures

### Daily Procedures
- [ ] Monitor active chat queues
- [ ] Process new ticket assignments
- [ ] Check for overdue tickets
- [ ] Review customer satisfaction ratings
- [ ] Update knowledge base with new solutions

### Weekly Procedures
- [ ] Generate support performance reports
- [ ] Review agent performance metrics
- [ ] Update automation rules
- [ ] Conduct team meetings
- [ ] Review escalation patterns

### Monthly Procedures
- [ ] Comprehensive support analytics
- [ ] Customer satisfaction surveys
- [ ] Knowledge base content review
- [ ] Training needs assessment
- [ ] Support process optimization

### Quarterly Procedures
- [ ] Support system performance audit
- [ ] Customer feedback analysis
- [ ] Automation rule optimization
- [ ] Agent training programs
- [ ] Support tool evaluation

## Common Issues and Solutions

### Ticket System Issues
```bash
# Issue: Tickets not auto-assigning
# Solution: Check assignment rules and agent availability
npm run support:check-assignment -- --ticket=ticket_123

# Issue: Chat not connecting
# Solution: Check agent availability and WebSocket connections
npm run support:check-chat -- --status=agents

# Issue: Knowledge base search not working
# Solution: Rebuild search index
npm run kb:rebuild-index

# Issue: Satisfaction surveys not sending
# Solution: Check survey configuration and email templates
npm run support:check-surveys -- --period=weekly
```

### Performance Issues
```bash
# Issue: Slow ticket loading
# Solution: Optimize database queries
npm run support:optimize-queries

# Issue: Chat latency issues
# Solution: Check WebSocket performance
npm run support:check-chat-performance

# Issue: High memory usage
# Solution: Monitor and optimize caching
npm run support:monitor-memory
```

---

*Last updated: $(date)*
