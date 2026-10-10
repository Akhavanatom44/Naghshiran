import { safeNextPath } from "@/lib/safe-next-path";
import LoginForm from "@/components/LoginForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function productCode(value: string | undefined): number | null {
  if (!value || !/^\d{1,12}$/.test(value)) return null;
  const code = Number(value);
  return Number.isSafeInteger(code) && code > 0 ? code : null;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const mode = first(params.mode);
  const nextPath = safeNextPath(first(params.next));
  const initialProductCode = productCode(first(params.add));

  return (
    <LoginForm
      initialMode={mode === "register" ? "register" : "login"}
      nextPath={nextPath}
      initialProductCode={initialProductCode}
    />
  );
}
