import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import Auth from '../components/Auth';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [session]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      {!session ? (
        <Auth supabaseClient={supabase} />
      ) : (
        <Dashboard user={session.user} supabaseClient={supabase} />
      )}
    </div>
  );
}
