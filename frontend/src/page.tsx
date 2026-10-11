import React, { useEffect, useState } from 'react';
import { supabase } from './utils/supabase/client';

export default function Page() {
  const [todos, setTodos] = useState<{ id: string | number; name: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('todos')
      .select('*')
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
        } else {
          setTodos(data as { id: string | number; name: string }[]);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="p-4 text-slate-400">Loading todos from Supabase...</p>;
  }

  if (error) {
    return (
      <div className="p-4 text-amber-400 bg-amber-950/20 border border-amber-800/40 rounded-lg m-4">
        <p className="font-semibold">Notice: {error}</p>
        <p className="text-xs text-amber-300/80 mt-1">
          Create the <code>todos</code> table in your Supabase SQL editor to see items.
        </p>
      </div>
    );
  }

  return (
    <ul className="p-4 space-y-2">
      {todos && todos.length > 0 ? (
        todos.map((todo) => (
          <li key={String(todo.id)} className="text-slate-200">
            {todo.name}
          </li>
        ))
      ) : (
        <li className="text-slate-500">No items in todos table.</li>
      )}
    </ul>
  );
}
