import { stripe } from "@/lib/stripe";

export async function findOrCreateCustomerByEmail(
  email: string,
  name?: string | null,
): Promise<string> {
  const existing = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existing.data.length > 0 && existing.data[0]) {
    return existing.data[0].id;
  }

  const created = await stripe.customers.create({
    email,
    name: name || undefined,
  });

  return created.id;
}
