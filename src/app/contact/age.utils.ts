// A date like "1999-12-15" is parsed as midnight UTC, so it is compared in
// UTC to give the same age on any server.
export function calculateAge(birthDate: string | Date): number {
  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getUTCFullYear() - birth.getUTCFullYear();

  const monthDifference = today.getUTCMonth() - birth.getUTCMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getUTCDate() < birth.getUTCDate())
  ) {
    age--;
  }

  return age;
}
