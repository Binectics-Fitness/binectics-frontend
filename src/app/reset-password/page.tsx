import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordQueryPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; flow?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const flow = Array.isArray(params.flow) ? params.flow[0] : params.flow;

  return <ResetPasswordForm token={token} flow={flow} />;
}
