import { createClient } from './server';

// Utility function to generate a random date between start and end dates
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Format date for Postgres
const formatDate = (date: Date) => {
  return date.toISOString();
};

export async function seedDatabase() {
  const supabase = await createClient();
  
  try {
    console.log('Starting database seeding...');
    
    // Clean up existing data
    await supabase.from('order_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('order_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('expense_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('material_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('material_purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('subtasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('suppliers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('Cleaned up existing data');
    
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user found');
    }
    
    const userId = user.id;
    
    // Create clients
    const clients = [
      { name: 'John Smith', email: 'john.smith@example.com', phone: '0755123456' },
      { name: 'Alice Johnson', email: 'alice.johnson@example.com', phone: '0755234567' },
      { name: 'Robert Davis', email: 'robert.davis@example.com', phone: '0755345678' },
      { name: 'Sarah Williams', email: 'sarah.williams@example.com', phone: '0755456789' },
      { name: 'Michael Brown', email: 'michael.brown@example.com', phone: '0755567890' },
      { name: 'Karen Cooper', email: 'karen.cooper@example.com', phone: '0755678901' },
      { name: 'Primax Ltd', email: 'contact@primax.com', phone: '0700123456' },
      { name: 'Zenith Enterprises', email: 'info@zenith.com', phone: '0701234567' },
    ];
    
    const { data: createdClients, error: clientsError } = await supabase
      .from('clients')
      .insert(clients)
      .select();
    
    if (clientsError) {
      throw new Error(`Error creating clients: ${clientsError.message}`);
    }
    
    console.log('Created clients');
    
    // Create suppliers
    const suppliers = [
      { name: 'Paper Supplies Co', contact_person: 'David Kim', phone: '0780123456', email: 'info@papersupplies.com' },
      { name: 'Ink Masters', contact_person: 'Lisa Wong', phone: '0780234567', email: 'sales@inkmasters.com' },
      { name: 'PrintTech Solutions', contact_person: 'James Carter', phone: '0780345678', email: 'contact@printtech.com' },
      { name: 'Graphics World', contact_person: 'Susan Lee', phone: '0780456789', email: 'orders@graphicsworld.com' },
    ];
    
    const { data: createdSuppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .insert(suppliers)
      .select();
    
    if (suppliersError) {
      throw new Error(`Error creating suppliers: ${suppliersError.message}`);
    }
    
    console.log('Created suppliers');
    
    // Create orders with varying statuses and dates
    const orderStatuses = ['pending', 'in_progress', 'completed', 'delivered', 'paused'];
    const orders = [];
    
    for (let i = 0; i < 30; i++) {
      const clientIndex = Math.floor(Math.random() * createdClients.length);
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const date = formatDate(randomDate(new Date(2024, 2, 1), new Date()));
      const totalAmount = Math.floor(Math.random() * 900000) + 100000; // Between 100k and 1M UGX
      const amountPaid = status === 'delivered' || status === 'completed' 
        ? totalAmount 
        : Math.floor(Math.random() * totalAmount);
      
      orders.push({
        client_id: createdClients[clientIndex].id,
        date,
        status,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        created_by: userId
      });
    }
    
    const { data: createdOrders, error: ordersError } = await supabase
      .from('orders')
      .insert(orders)
      .select();
    
    if (ordersError) {
      throw new Error(`Error creating orders: ${ordersError.message}`);
    }
    
    console.log('Created orders');
    
    // Create order items
    const categories = ['Business Cards', 'Flyers', 'Banners', 'Brochures', 'Posters', 'T-Shirts', 'Stickers'];
    const orderItems = [];
    
    for (const order of createdOrders) {
      // Add 1-3 items per order
      const itemCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < itemCount; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const quantity = Math.floor(Math.random() * 100) + 1;
        const unitPrice = Math.floor(Math.random() * 50000) + 5000;
        const profit = Math.floor(unitPrice * 0.3); // 30% profit
        
        orderItems.push({
          order_id: order.id,
          category,
          description: `${category} - ${['A4', 'A5', 'A6', 'Custom'][Math.floor(Math.random() * 4)]}`,
          quantity,
          unit_price: unitPrice,
          profit_amount: profit
        });
      }
    }
    
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (orderItemsError) {
      throw new Error(`Error creating order items: ${orderItemsError.message}`);
    }
    
    console.log('Created order items');
    
    // Create order payments
    const paymentTypes = ['cash', 'bank_transfer', 'mobile_money'];
    const orderPayments = [];
    
    for (const order of createdOrders) {
      if (order.amount_paid > 0) {
        // Create 1-2 payments per order
        const paymentCount = order.amount_paid === order.total_amount ? 1 : Math.floor(Math.random() * 2) + 1;
        let remainingAmount = order.amount_paid;
        
        for (let i = 0; i < paymentCount; i++) {
          const isLastPayment = i === paymentCount - 1;
          const amount = isLastPayment ? remainingAmount : Math.floor(remainingAmount / 2);
          remainingAmount -= amount;
          
          orderPayments.push({
            order_id: order.id,
            amount,
            date: formatDate(new Date(order.date)),
            type: paymentTypes[Math.floor(Math.random() * paymentTypes.length)],
            created_by: userId
          });
        }
      }
    }
    
    const { error: orderPaymentsError } = await supabase
      .from('order_payments')
      .insert(orderPayments);
    
    if (orderPaymentsError) {
      throw new Error(`Error creating order payments: ${orderPaymentsError.message}`);
    }
    
    console.log('Created order payments');
    
    // Create expenses
    const expenseCategories = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Equipment', 'Maintenance'];
    const expenses = [];
    
    for (let i = 0; i < 15; i++) {
      const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      const date = formatDate(randomDate(new Date(2024, 2, 1), new Date()));
      const totalAmount = Math.floor(Math.random() * 500000) + 50000;
      const amountPaid = Math.random() > 0.3 ? totalAmount : Math.floor(Math.random() * totalAmount);
      const installment = amountPaid < totalAmount;
      
      expenses.push({
        date,
        category,
        description: `${category} expense - ${Math.random().toString(36).substring(2, 10)}`,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        installment,
        vat: category === 'Equipment' ? Math.floor(totalAmount * 0.18) : 0,
        created_by: userId
      });
    }
    
    const { data: createdExpenses, error: expensesError } = await supabase
      .from('expenses')
      .insert(expenses)
      .select();
    
    if (expensesError) {
      throw new Error(`Error creating expenses: ${expensesError.message}`);
    }
    
    console.log('Created expenses');
    
    // Create expense payments
    const expensePayments = [];
    
    for (const expense of createdExpenses) {
      if (expense.amount_paid > 0) {
        expensePayments.push({
          expense_id: expense.id,
          amount: expense.amount_paid,
          date: expense.date,
          type: paymentTypes[Math.floor(Math.random() * paymentTypes.length)],
          created_by: userId
        });
      }
    }
    
    const { error: expensePaymentsError } = await supabase
      .from('expense_payments')
      .insert(expensePayments);
    
    if (expensePaymentsError) {
      throw new Error(`Error creating expense payments: ${expensePaymentsError.message}`);
    }
    
    console.log('Created expense payments');
    
    // Create material purchases
    const materialItems = ['Paper', 'Ink', 'Toner', 'Vinyl', 'Canvas', 'PVC', 'Business Card Stock'];
    const materialPurchases = [];
    
    for (let i = 0; i < 20; i++) {
      const supplierIndex = Math.floor(Math.random() * createdSuppliers.length);
      const description = materialItems[Math.floor(Math.random() * materialItems.length)];
      const date = formatDate(randomDate(new Date(2024, 2, 1), new Date()));
      const quantity = Math.floor(Math.random() * 100) + 1;
      const totalAmount = Math.floor(Math.random() * 800000) + 200000;
      const amountPaid = Math.random() > 0.3 ? totalAmount : Math.floor(Math.random() * totalAmount);
      const installment = amountPaid < totalAmount;
      
      materialPurchases.push({
        supplier_id: createdSuppliers[supplierIndex].id,
        date,
        description,
        quantity,
        unit: ['box', 'ream', 'roll', 'piece', 'kg'][Math.floor(Math.random() * 5)],
        total_amount: totalAmount,
        amount_paid: amountPaid,
        installment,
        created_by: userId
      });
    }
    
    const { data: createdPurchases, error: purchasesError } = await supabase
      .from('material_purchases')
      .insert(materialPurchases)
      .select();
    
    if (purchasesError) {
      throw new Error(`Error creating material purchases: ${purchasesError.message}`);
    }
    
    console.log('Created material purchases');
    
    // Create material payments
    const materialPayments = [];
    
    for (const purchase of createdPurchases) {
      if (purchase.amount_paid > 0) {
        materialPayments.push({
          purchase_id: purchase.id,
          amount: purchase.amount_paid,
          date: purchase.date,
          type: paymentTypes[Math.floor(Math.random() * paymentTypes.length)],
          created_by: userId
        });
      }
    }
    
    const { error: materialPaymentsError } = await supabase
      .from('material_payments')
      .insert(materialPayments);
    
    if (materialPaymentsError) {
      throw new Error(`Error creating material payments: ${materialPaymentsError.message}`);
    }
    
    console.log('Created material payments');
    
    // Create tasks
    const taskPriorities = ['low', 'medium', 'high', 'urgent'];
    const taskStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    const taskTitles = [
      'Follow up on order payment',
      'Call client for approval',
      'Order supplies',
      'Schedule delivery',
      'Design review meeting',
      'Update price list',
      'Maintenance checkup',
      'Staff training',
      'Pay supplier invoice',
      'Client presentation'
    ];
    
    const tasks = [];
    
    // Create some general tasks
    for (let i = 0; i < 10; i++) {
      const title = taskTitles[Math.floor(Math.random() * taskTitles.length)];
      const dueDate = formatDate(randomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))); // Due in next 2 weeks
      const priority = taskPriorities[Math.floor(Math.random() * taskPriorities.length)];
      const status = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
      
      tasks.push({
        title,
        description: `Task details: ${Math.random().toString(36).substring(2, 10)}`,
        due_date: dueDate,
        priority,
        status,
        recurring: false,
        linked_item_type: 'none',
        linked_item_id: null,
        assigned_to: userId,
        created_by: userId
      });
    }
    
    // Create some order-linked tasks
    for (let i = 0; i < 10; i++) {
      const orderIndex = Math.floor(Math.random() * createdOrders.length);
      const title = `Follow up on Order #${createdOrders[orderIndex].id.substring(0, 8)}`;
      const dueDate = formatDate(randomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)));
      const priority = taskPriorities[Math.floor(Math.random() * taskPriorities.length)];
      const status = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
      
      tasks.push({
        title,
        description: `Order follow-up task for client: ${createdClients[Math.floor(Math.random() * createdClients.length)].name}`,
        due_date: dueDate,
        priority,
        status,
        recurring: false,
        linked_item_type: 'order',
        linked_item_id: createdOrders[orderIndex].id,
        assigned_to: userId,
        created_by: userId
      });
    }
    
    // Create some expense-linked tasks
    for (let i = 0; i < 5; i++) {
      const expenseIndex = Math.floor(Math.random() * createdExpenses.length);
      const title = `Pay expense #${createdExpenses[expenseIndex].id.substring(0, 8)}`;
      const dueDate = formatDate(randomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)));
      const priority = taskPriorities[Math.floor(Math.random() * taskPriorities.length)];
      const status = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
      
      tasks.push({
        title,
        description: `Make payment for: ${createdExpenses[expenseIndex].description}`,
        due_date: dueDate,
        priority,
        status,
        recurring: false,
        linked_item_type: 'expense',
        linked_item_id: createdExpenses[expenseIndex].id,
        assigned_to: userId,
        created_by: userId
      });
    }
    
    // Create some purchase-linked tasks
    for (let i = 0; i < 5; i++) {
      const purchaseIndex = Math.floor(Math.random() * createdPurchases.length);
      const title = `Follow up on purchase #${createdPurchases[purchaseIndex].id.substring(0, 8)}`;
      const dueDate = formatDate(randomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)));
      const priority = taskPriorities[Math.floor(Math.random() * taskPriorities.length)];
      const status = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
      
      tasks.push({
        title,
        description: `Check delivery status for: ${createdPurchases[purchaseIndex].description}`,
        due_date: dueDate,
        priority,
        status,
        recurring: false,
        linked_item_type: 'purchase',
        linked_item_id: createdPurchases[purchaseIndex].id,
        assigned_to: userId,
        created_by: userId
      });
    }
    
    const { data: createdTasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(tasks)
      .select();
    
    if (tasksError) {
      throw new Error(`Error creating tasks: ${tasksError.message}`);
    }
    
    console.log('Created tasks');
    
    // Create subtasks
    const subtasks = [];
    
    for (const task of createdTasks) {
      // Create 0-3 subtasks per task
      const subtaskCount = Math.floor(Math.random() * 4);
      
      for (let i = 0; i < subtaskCount; i++) {
        subtasks.push({
          task_id: task.id,
          title: `Subtask ${i + 1} for ${task.title}`,
          status: Math.random() > 0.5 ? 'pending' : 'completed'
        });
      }
    }
    
    if (subtasks.length > 0) {
      const { error: subtasksError } = await supabase
        .from('subtasks')
        .insert(subtasks);
      
      if (subtasksError) {
        throw new Error(`Error creating subtasks: ${subtasksError.message}`);
      }
      
      console.log('Created subtasks');
    }
    
    console.log('Database seeding completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error };
  }
} 