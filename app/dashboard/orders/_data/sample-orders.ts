import { Order } from '@/types/orders';

/**
 * Sample order data for development
 */
export const SAMPLE_ORDERS: Order[] = [
  {
    id: 'ORD00123',
    client_id: 'client1',
    client_name: 'Acme Corp',
    client_type: 'contract',
    date: '2024-03-15',
    status: 'in_progress',
    payment_status: 'partially_paid',
    total_amount: 1250.00,
    amount_paid: 500.00,
    balance: 750.00,
    created_by: 'user1',
    created_at: '2024-03-15T10:30:00Z',
    updated_at: '2024-03-15T10:30:00Z',
    items: [
      {
        id: 'item1',
        order_id: 'ORD00123',
        item_id: 'product1',
        category_id: 'cat1',
        category_name: 'Printing',
        item_name: 'Business Cards',
        quantity: 500,
        unit_price: 0.90,
        total_amount: 450.00,
        created_at: '2024-03-15T10:30:00Z',
        updated_at: '2024-03-15T10:30:00Z'
      },
      {
        id: 'item2',
        order_id: 'ORD00123',
        item_id: 'product2',
        category_id: 'cat1',
        category_name: 'Printing',
        item_name: 'Letterheads',
        quantity: 100,
        unit_price: 8.00,
        total_amount: 800.00,
        created_at: '2024-03-15T10:30:00Z',
        updated_at: '2024-03-15T10:30:00Z'
      }
    ],
    notes: [
      {
        id: 'note1',
        type: 'info',
        text: 'Client needs a rush delivery',
        linked_item_type: 'order',
        linked_item_id: 'ORD00123',
        created_by: 'user1',
        created_at: '2024-03-15T10:35:00Z',
        updated_at: '2024-03-15T10:35:00Z'
      }
    ]
  },
  {
    id: 'ORD00124',
    client_id: 'client2',
    client_name: 'TechStart Inc',
    client_type: 'regular',
    date: '2024-03-20',
    status: 'paused',
    payment_status: 'unpaid',
    total_amount: 3500.00,
    amount_paid: 0.00,
    balance: 3500.00,
    created_by: 'user1',
    created_at: '2024-03-20T14:15:00Z',
    updated_at: '2024-03-20T14:15:00Z',
    items: [
      {
        id: 'item3',
        order_id: 'ORD00124',
        item_id: 'product3',
        category_id: 'cat2',
        category_name: 'Marketing',
        item_name: 'Brochures',
        quantity: 1000,
        unit_price: 2.20,
        total_amount: 2200.00,
        created_at: '2024-03-20T14:15:00Z',
        updated_at: '2024-03-20T14:15:00Z'
      },
      {
        id: 'item4',
        order_id: 'ORD00124',
        item_id: 'product4',
        category_id: 'cat2',
        category_name: 'Marketing',
        item_name: 'Posters',
        quantity: 50,
        unit_price: 26.00,
        total_amount: 1300.00,
        created_at: '2024-03-20T14:15:00Z',
        updated_at: '2024-03-20T14:15:00Z'
      }
    ]
  },
  {
    id: 'ORD00125',
    client_id: 'client3',
    client_name: 'Local Restaurant',
    client_type: 'contract',
    date: '2024-03-25',
    status: 'completed',
    payment_status: 'paid',
    total_amount: 850.00,
    amount_paid: 850.00,
    balance: 0.00,
    created_by: 'user1',
    created_at: '2024-03-25T09:45:00Z',
    updated_at: '2024-03-27T11:20:00Z',
    items: [
      {
        id: 'item5',
        order_id: 'ORD00125',
        item_id: 'product5',
        category_id: 'cat3',
        category_name: 'Stationery',
        item_name: 'Menu Cards',
        quantity: 200,
        unit_price: 3.00,
        total_amount: 600.00,
        created_at: '2024-03-25T09:45:00Z',
        updated_at: '2024-03-25T09:45:00Z'
      },
      {
        id: 'item6',
        order_id: 'ORD00125',
        item_id: 'product6',
        category_id: 'cat3',
        category_name: 'Stationery',
        item_name: 'Table Tents',
        quantity: 50,
        unit_price: 5.00,
        total_amount: 250.00,
        created_at: '2024-03-25T09:45:00Z',
        updated_at: '2024-03-25T09:45:00Z'
      }
    ],
    notes: [
      {
        id: 'note2',
        type: 'client_follow_up',
        text: 'Client requested quote for additional items',
        linked_item_type: 'order',
        linked_item_id: 'ORD00125',
        created_by: 'user1',
        created_at: '2024-03-27T11:20:00Z',
        updated_at: '2024-03-27T11:20:00Z'
      }
    ]
  }
]; 