import InjectionGame from "./InjectionGame";

export const metadata = { title: "Spot the Injection" };

export default async function Page(props) {
  const sp = await props.searchParams;
  const seed = typeof sp?.seed === "string" && /^[a-z0-9-]{1,32}$/i.test(sp.seed) ? sp.seed : null;
  return <InjectionGame challengeSeed={seed} />;
}
