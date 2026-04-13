import { redirect } from "next/navigation";
import { getSession } from "@/utilities/getSession";

export const metadata = {
  title: "Welcome - Galixee",
  description: "Your Galixee profile in the Foreververse"
};

export default async function WelcomeLayout({ children }) {
  // Check if user is authenticated on the server
  const session = await getSession();
  
  if (!session) {
    // Redirect to signin if not authenticated
    redirect("/account/signin?callbackUrl=/welcome");
  }

  return <>{children}</>;
}
