import { createServerSupabaseClient } from '@/lib/db/supabase-server';
import { redirect } from 'next/navigation';
import ExploreClient from './ExploreClient';
import Footer from '@/components/layout/Footer';

export const runtime = 'edge';

export default async function ExplorePage() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/auth/login');
    }

    return <ExploreClient user={{ id: user.id, email: user.email ?? '' }} />;
  } catch (err) {
    const message = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack ?? ''}` : String(err);
    return (
      <pre style={{ padding: 16, whiteSpace: 'pre-wrap' }}>
        Explore SSR error:{'\n\n'}
        {message}
      </pre>
    );
  }
}