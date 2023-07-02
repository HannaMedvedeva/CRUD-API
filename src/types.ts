export interface UserData {
    id: string,
    username: string,
    age: number,
    hobbies: string[],
}

export const enum RequestMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
}

export type UserRequestData = Omit<UserData, 'id'>
