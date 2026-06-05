export type SignupFormFields = {
  fullName: string;
  email: string;
  emailConfirmation: string;
  password: string;
  passwordConfirmation: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignupForm(fields: SignupFormFields) {
  const fullName = fields.fullName.trim();
  const email = fields.email.trim();
  const emailConfirmation = fields.emailConfirmation.trim();

  if (fullName.length < 2) {
    return { ok: false as const, error: "Informe seu nome." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false as const, error: "Informe um email válido." };
  }

  if (!EMAIL_PATTERN.test(emailConfirmation)) {
    return { ok: false as const, error: "Confirme com um email válido." };
  }

  if (email !== emailConfirmation) {
    return { ok: false as const, error: "A confirmação de email não confere." };
  }

  if (fields.password.length < 6) {
    return { ok: false as const, error: "A senha deve ter pelo menos 6 caracteres." };
  }

  if (fields.passwordConfirmation.length < 6) {
    return { ok: false as const, error: "Confirme a senha com pelo menos 6 caracteres." };
  }

  if (fields.password !== fields.passwordConfirmation) {
    return { ok: false as const, error: "A confirmação de senha não confere." };
  }

  return {
    ok: true as const,
    data: {
      fullName,
      email,
      password: fields.password,
    },
  };
}
