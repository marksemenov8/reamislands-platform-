import LoginView from "./LoginView"

export const dynamic = "force-dynamic"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams
  return <LoginView nextPath={params.next ?? "/"} />
}
