'use client';
import dynamic from 'next/dynamic';

const AdminApp = dynamic(() => import('@/components/admin/AdminApp'), { ssr: false, loading: () => null });

export default function AdminPage() {
  return <AdminApp />;
}
