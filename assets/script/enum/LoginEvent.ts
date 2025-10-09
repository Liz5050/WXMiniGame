export const LoginEvent = <const> {
    Login : "Login",
}

export type LoginEventData = UnionRecords<
    [
        Record<typeof LoginEvent.Login,number>,
    ]
>;