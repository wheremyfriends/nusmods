import { ApolloClient, NormalizedCacheObject, gql } from "@apollo/client";
import { AuthUser } from "types/accounts";

export async function createUser(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  roomID: string,
) {
  const CREATE_USER = gql`
    mutation CreateUser($roomID: String!) {
      createUser(roomID: $roomID)
    }
  `;

  try {
    await apolloClient.mutate({
      mutation: CREATE_USER,
      variables: {
        roomID,
      },
    });
  } catch (err) {
    console.error("CREATE_USER error: ", err);
  }
}

export async function getUser(
  apolloClient: ApolloClient<NormalizedCacheObject>,
) {
  const query = gql`
    query GetUser {
      getUser {
        userID
        username
      }
    }
  `;

  try {
    const res = await apolloClient.mutate({
      mutation: query,
    });
    return res.data.getUser as AuthUser;
  } catch (err) {
    console.error("GET_USER error: ", err);
  }

  return undefined;
}
export async function registerUser(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  username: string,
  password: string,
) {
  const REGISTER_USER = gql`
    mutation RegisterUser($username: String!, $password: String!) {
      registerUser(username: $username, password: $password)
    }
  `;

  try {
    await apolloClient.mutate({
      mutation: REGISTER_USER,
      variables: {
        username,
        password,
      },
    });
  } catch (err) {
    console.error("REGISTER_USER error: ", err);
  }
}

export async function loginUser(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  username: string,
  password: string,
) {
  const LOGIN_USER = gql`
    mutation LoginUser($username: String!, $password: String!) {
      loginUser(username: $username, password: $password) {
        userID
        username
      }
    }
  `;

  try {
    const res = await apolloClient.mutate({
      mutation: LOGIN_USER,
      variables: {
        username,
        password,
      },
    });
    return res.data.loginUser as AuthUser;
  } catch (err) {
    console.error("LOGIN_USER error: ", err);
  }

  return undefined;
}

export async function logoutUser(
  apolloClient: ApolloClient<NormalizedCacheObject>,
) {
  const query = gql`
    mutation LogoutUser {
      logoutUser
    }
  `;

  try {
    await apolloClient.mutate({
      mutation: query,
    });
  } catch (err) {
    console.error("LOGOUT_USER error: ", err);
  }
}

export function subscribeToLessonChanges(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  roomID: string,
  callback: (arg: any) => void,
) {
  const LESSON_CHANGE_SUBSCRIPTION = gql`
    subscription LessonChange($roomID: String!) {
      lessonChange(roomID: $roomID) {
        action
        userID
        semester
        moduleCode
        lessonType
        classNo
      }
    }
  `;

  apolloClient
    .subscribe({
      query: LESSON_CHANGE_SUBSCRIPTION,
      variables: {
        roomID,
      },
    })
    .subscribe({
      next(data) {
        if (data.data) {
          callback(data.data.lessonChange);
        }
      },
      error(error) {
        console.log("Apollo subscribe error", error);
      },
      complete() {},
    });
}
