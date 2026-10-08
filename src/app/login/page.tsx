import LoginForm from "@/components/LoginForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function safeNextPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const mode = first(params.mode);
  const nextPath = safeNextPath(first(params.next));

  return <LoginForm initialMode={mode === "register" ? "register" : "login"} nextPath={nextPath} />;
}
