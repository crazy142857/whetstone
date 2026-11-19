import CorrelationGame from "./CorrelationGame";

export const metadata = { title: "Guess the Correlation+" };

export default async function Page(props) {
  const sp = await props.searchParams;
  const seed = typeof sp?.seed === "string" && /^[a-z0-9-]{1,32}$/i.test(sp.seed) ? sp.seed : null;
  return <CorrelationGame challengeSeed={seed} />;
}
