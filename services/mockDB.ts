
import { Ticket, TicketStatus, Channel, Priority, Customer, Message } from '../types';

const DB_KEY = 'digital_fte_crm_db';

interface DBState {
  tickets: Ticket[];
  customers: Customer[];
}

const initialState: DBState = {
  tickets: [],
  customers: []
};

const getDB = (): DBState => {
  const data = localStorage.getItem(DB_KEY);
  return data ? JSON.parse(data) : initialState;
};

const saveDB = (state: DBState) => {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
};

export const createTicket = (
  data: { 
    name: string; 
    email: string; 
    subject: string; 
    category: string; 
    message: string; 
    channel: Channel;
    priority: Priority;
  }
): Ticket => {
  const db = getDB();
  
  let customer = db.customers.find(c => c.email === data.email);
  if (!customer) {
    customer = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      created_at: new Date().toISOString(),
      metadata: {}
    };
    db.customers.push(customer);
  }

  const conversation_id = crypto.randomUUID();
  const initialMessage: Message = {
    id: crypto.randomUUID(),
    conversation_id,
    channel: data.channel,
    direction: 'inbound',
    role: 'customer',
    content: data.message,
    created_at: new Date().toISOString()
  };

  const newTicket: Ticket = {
    id: crypto.randomUUID(),
    conversation_id,
    customer_id: customer.id,
    customer_name: customer.name,
    customer_email: customer.email,
    source_channel: data.channel,
    subject: data.subject,
    category: data.category,
    priority: data.priority,
    status: TicketStatus.OPEN,
    created_at: new Date().toISOString(),
    messages: [initialMessage]
  };

  db.tickets.unshift(newTicket);
  saveDB(db);
  return newTicket;
};

export const updateTicket = (id: string, updates: Partial<Ticket>) => {
  const db = getDB();
  const index = db.tickets.findIndex(t => t.id === id);
  if (index !== -1) {
    db.tickets[index] = { ...db.tickets[index], ...updates };
    saveDB(db);
  }
};

export const addMessageToTicket = (ticketId: string, message: Omit<Message, 'id' | 'created_at'>) => {
  const db = getDB();
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (ticket) {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    ticket.messages.push(newMessage);
    saveDB(db);
    return newMessage;
  }
};

export const getAllTickets = () => getDB().tickets;
export const getTicketById = (id: string) => getDB().tickets.find(t => t.id === id);
export const getCustomerHistory = (email: string) => {
  const db = getDB();
  return db.tickets.filter(t => t.customer_email === email);
};
