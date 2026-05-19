import { LoginForm } from './LoginForm';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-2xl font-semibold">Admin sign in</h1>
      <p className="mt-2 text-sm text-stone-600">
        Enter the admin password to manage the clothing catalogue.
      </p>
      <LoginForm next={params.next ?? '/admin/clothes'} error={params.error} />
    </div>
  );
}
