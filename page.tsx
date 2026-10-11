import React from 'react';
import { createClient } from './utils/supabase/server';
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from('todos').select();

  if (error) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <h2>Supabase Connected</h2>
        <p style={{ color: '#d97706' }}>Status: {error.message}</p>
        <p>To initialize the table, run the SQL script in your Supabase SQL Editor.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Supabase Todos</h1>
      {todos && todos.length > 0 ? (
        <ul>
          {todos.map((todo: any) => (
            <li key={todo.id}>{todo.name}</li>
          ))}
        </ul>
      ) : (
        <p>No items found in the <code>todos</code> table.</p>
      )}
    </main>
  );
}
