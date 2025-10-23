import { redirect } from 'next/navigation';

export default function AdminPage() {
  // Redirect to events as the default admin page
  redirect('/admin/events');
}
