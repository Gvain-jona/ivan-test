import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Utility function to generate a random date between start and end dates
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Format date for Postgres
const formatDate = (date: Date) => {
  return date.toISOString();
};

export async function GET() {
  try {
    // Use service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
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
    
    // Use a specific admin user ID for all seeded data
    const userId = "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p"; // Replace with an actual admin user ID from your system
    
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
      const clientIndex = Math.floor(Math.random() * (createdClients?.length || 1));
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const date = formatDate(randomDate(new Date(2024, 2, 1), new Date()));
      const totalAmount = Math.floor(Math.random() * 900000) + 100000; // Between 100k and 1M UGX
      const amountPaid = status === 'delivered' || status === 'completed' 
        ? totalAmount 
        : Math.floor(Math.random() * totalAmount);
      const balance = totalAmount - amountPaid;
      
      orders.push({
        client_id: createdClients?.[clientIndex]?.id,
        date,
        status,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        balance,
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
    
    for (const order of createdOrders || []) {
      // Add 1-3 items per order
      const itemCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < itemCount; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const quantity = Math.floor(Math.random() * 100) + 1;
        const unitPrice = Math.floor(Math.random() * 50000) + 5000;
        const profit = Math.floor(unitPrice * 0.3); // 30% profit
        const totalAmount = quantity * unitPrice;
        
        orderItems.push({
          order_id: order.id,
          category,
          description: `${category} - ${['A4', 'A5', 'A6', 'Custom'][Math.floor(Math.random() * 4)]}`,
          quantity,
          unit_price: unitPrice,
          total_amount: totalAmount,
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
    
    for (const order of createdOrders || []) {
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
    
    // Create material purchases
    const materialPurchases = [];
    const materialCategories = ['Paper', 'Ink', 'Vinyl', 'Toner', 'Lamination Film', 'Binding Materials'];
    const materialUnits = ['Ream', 'Liter', 'Roll', 'Cartridge', 'Box', 'Pack'];

    for (let i = 0; i < 20; i++) {
      const supplierIndex = Math.floor(Math.random() * (createdSuppliers?.length || 1));
      const category = materialCategories[Math.floor(Math.random() * materialCategories.length)];
      const unit = materialUnits[Math.floor(Math.random() * materialUnits.length)];
      const quantity = Math.floor(Math.random() * 50) + 1;
      const unitPrice = Math.floor(Math.random() * 100000) + 10000;
      const totalAmount = quantity * unitPrice;
      const amountPaid = Math.random() > 0.3 ? totalAmount : Math.floor(Math.random() * totalAmount);
      const balance = totalAmount - amountPaid;
      const date = formatDate(randomDate(new Date(2024, 2, 1), new Date()));
      
      materialPurchases.push({
        supplier_id: createdSuppliers?.[supplierIndex]?.id,
        date,
        description: `${category} - ${unit}`,
        quantity,
        unit,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        balance,
        installment: amountPaid < totalAmount,
        created_by: userId
      });
    }

    const { data: createdMaterialPurchases, error: materialPurchasesError } = await supabase
      .from('material_purchases')
      .insert(materialPurchases)
      .select();

    if (materialPurchasesError) {
      throw new Error(`Error creating material purchases: ${materialPurchasesError.message}`);
    }

    console.log('Created material purchases');

    // Create material payments
    const materialPayments = [];

    for (const purchase of createdMaterialPurchases || []) {
      if (purchase.amount_paid > 0) {
        const paymentCount = purchase.amount_paid === purchase.total_amount ? 1 : Math.floor(Math.random() * 2) + 1;
        let remainingAmount = purchase.amount_paid;
        
        for (let i = 0; i < paymentCount; i++) {
          const isLastPayment = i === paymentCount - 1;
          const amount = isLastPayment ? remainingAmount : Math.floor(remainingAmount / 2);
          remainingAmount -= amount;
          
          materialPayments.push({
            material_purchase_id: purchase.id,
            amount,
            date: formatDate(new Date(purchase.date)),
            type: paymentTypes[Math.floor(Math.random() * paymentTypes.length)],
            created_by: userId
          });
        }
      }
    }

    const { error: materialPaymentsError } = await supabase
      .from('material_payments')
      .insert(materialPayments);

    if (materialPaymentsError) {
      throw new Error(`Error creating material payments: ${materialPaymentsError.message}`);
    }

    console.log('Created material payments');

    // Create tasks (todos)
    const taskPriorities = ['low', 'medium', 'high'];
    const taskStatuses = ['pending', 'in_progress', 'completed', 'paused'];
    const taskCategories = ['Design', 'Production', 'Delivery', 'Follow-up', 'Maintenance', 'Administrative'];
    const tasks = [];

    for (let i = 0; i < 25; i++) {
      const priority = taskPriorities[Math.floor(Math.random() * taskPriorities.length)];
      const status = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
      const category = taskCategories[Math.floor(Math.random() * taskCategories.length)];
      const dueDate = formatDate(randomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))); // Due within next 2 weeks
      const isOrderLinked = Math.random() > 0.7 && (createdOrders?.length || 0) > 0;
      const linkedOrder = isOrderLinked ? createdOrders?.[Math.floor(Math.random() * (createdOrders?.length || 1))] : null;
      
      tasks.push({
        title: `${category} Task - ${Math.random().toString(36).substring(2, 8)}`,
        description: `${category} related task that needs to be completed${linkedOrder ? ` for order #${linkedOrder.id.substring(0, 8)}` : ''}`,
        due_date: dueDate,
        priority,
        status,
        recurring: Math.random() > 0.8,
        linked_item_type: linkedOrder ? 'order' : null,
        linked_item_id: linkedOrder?.id || null,
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

    // Create subtasks for some tasks
    const subtasks = [];

    for (const task of createdTasks || []) {
      if (Math.random() > 0.5) { // 50% chance of having subtasks
        const subtaskCount = Math.floor(Math.random() * 3) + 1; // 1-3 subtasks
        
        for (let i = 0; i < subtaskCount; i++) {
          subtasks.push({
            task_id: task.id,
            title: `Subtask ${i + 1} for ${task.title}`,
            description: `Step ${i + 1} of the main task`,
            status: taskStatuses[Math.floor(Math.random() * taskStatuses.length)],
            created_by: userId
          });
        }
      }
    }

    const { error: subtasksError } = await supabase
      .from('subtasks')
      .insert(subtasks);

    if (subtasksError) {
      throw new Error(`Error creating subtasks: ${subtasksError.message}`);
    }

    console.log('Created subtasks');

    // Create additional expenses
    const expenseCategories = [
      'Rent',
      'Utilities',
      'Salaries',
      'Marketing',
      'Equipment',
      'Maintenance',
      'Internet',
      'Insurance',
      'Office Supplies',
      'Training',
      'Travel',
      'Software Subscriptions'
    ];

    const expenses = [];

    for (let i = 0; i < 30; i++) {
      const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      const date = formatDate(randomDate(new Date(2024, 2, 1), new Date()));
      const totalAmount = Math.floor(Math.random() * 1000000) + 50000;
      const amountPaid = Math.random() > 0.3 ? totalAmount : Math.floor(Math.random() * totalAmount);
      const balance = totalAmount - amountPaid;
      const installment = amountPaid < totalAmount;
      
      expenses.push({
        date,
        category,
        description: `${category} expense - ${Math.random().toString(36).substring(2, 10)}`,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        balance,
        installment,
        vat: ['Equipment', 'Software Subscriptions'].includes(category) ? Math.floor(totalAmount * 0.18) : 0,
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

    for (const expense of createdExpenses || []) {
      if (expense.amount_paid > 0) {
        const paymentCount = expense.amount_paid === expense.total_amount ? 1 : Math.floor(Math.random() * 2) + 1;
        let remainingAmount = expense.amount_paid;
        
        for (let i = 0; i < paymentCount; i++) {
          const isLastPayment = i === paymentCount - 1;
          const amount = isLastPayment ? remainingAmount : Math.floor(remainingAmount / 2);
          remainingAmount -= amount;
          
          expensePayments.push({
            expense_id: expense.id,
            amount,
            date: expense.date,
            type: paymentTypes[Math.floor(Math.random() * paymentTypes.length)],
            created_by: userId
          });
        }
      }
    }

    const { error: expensePaymentsError } = await supabase
      .from('expense_payments')
      .insert(expensePayments);

    if (expensePaymentsError) {
      throw new Error(`Error creating expense payments: ${expensePaymentsError.message}`);
    }

    console.log('Created expense payments');

    // Create order notes
    const orderNotes = [];

    for (const order of createdOrders || []) {
      if (Math.random() > 0.6) { // 40% chance of having a note
        orderNotes.push({
          order_id: order.id,
          note: `Note for order #${order.id.substring(0, 8)}: ${['Special delivery instructions', 'Client requirements', 'Payment details', 'Design specifications'][Math.floor(Math.random() * 4)]}`,
          created_by: userId
        });
      }
    }

    if (orderNotes.length > 0) {
      const { error: orderNotesError } = await supabase
        .from('order_notes')
        .insert(orderNotes);

      if (orderNotesError) {
        throw new Error(`Error creating order notes: ${orderNotesError.message}`);
      }

      console.log('Created order notes');
    }

    console.log('Database seeding completed successfully!');
    
    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 