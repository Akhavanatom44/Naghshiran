import { safeNextPath } from "@/lib/safe-next-path";
import LoginForm from "@/components/LoginForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const mode = first(params.mode);
  const nextPath = safeNextPath(first(params.next));

  return <LoginForm initialMode={mode === "register" ? "register" : "login"} nextPath={nextPath} />;
}
