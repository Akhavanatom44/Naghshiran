import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/";
  redirect(`/login?mode=register&next=${encodeURIComponent(nextPath)}`);
}
