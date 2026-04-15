import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"


export function RegisterForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Crea tu cuenta</CardTitle>
                    <CardDescription>
                        Ingresa tu correo electrónico para crear tu cuenta
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">Nombre Completo</FieldLabel>
                                <Input id="name" type="text" placeholder="Juan Pérez" required />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email">Correo Electrónico</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@correo.com"
                                    required
                                />
                            </Field>
                            <Field>
                                <Field className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                                        <Input id="password" type="password" required />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="confirm-password">
                                            Confirmar Contraseña
                                        </FieldLabel>
                                        <Input id="confirm-password" type="password" required />
                                    </Field>
                                </Field>
                                <FieldDescription>
                                    Debe tener al menos 8 caracteres.
                                </FieldDescription>
                            </Field>
                            <Field>
                                <Button type="submit">Crear Cuenta</Button>
                                <FieldDescription className="text-center">
                                    ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
                Al continuar, aceptas nuestros <a href="#">Términos de Servicio</a>{" "}
                y <a href="#">Política de Privacidad</a>.
            </FieldDescription>
        </div>
    )
}
