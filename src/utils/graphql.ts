import { ApolloClient, NormalizedCacheObject, gql } from "@apollo/client";
import { AuthUser } from "types/accounts";
import { ClassNo, LessonType, ModuleCode } from "types/modules";
import {
  LessonChange,
  TimetableGeneratorConfig,
  UserChange,
} from "types/timetables";

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
    console.error("CREATE_USER error: ", err.message);
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
    console.error("GET_USER error: ", err.message);
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
    console.error("REGISTER_USER error: ", err.message);
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
    console.error("LOGIN_USER error: ", err.message);
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
    console.error("LOGOUT_USER error: ", err.message);
  }
}

export async function getRooms(
  apolloClient: ApolloClient<NormalizedCacheObject>,
) {
  const query = gql`
    query GetRooms {
      getRooms
    }
  `;

  try {
    const res = await apolloClient.mutate({
      mutation: query,
    });

    return res.data.getRooms as string[];
  } catch (err) {
    console.error("GET_ROOMS error: ", err.message);
  }

  return undefined;
}

export async function createLesson(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  roomID: string | undefined,
  userID: number,
  semester: number,
  moduleCode: ModuleCode,
  lessonType: LessonType,
  classNo: ClassNo,
) {
  const CREATE_LESSON = gql`
    mutation CreateLesson(
      $roomID: String
      $userID: Int!
      $semester: Int!
      $moduleCode: String!
      $lessonType: String!
      $classNo: String!
    ) {
      createLesson(
        roomID: $roomID
        userID: $userID
        semester: $semester
        moduleCode: $moduleCode
        lessonType: $lessonType
        classNo: $classNo
      )
    }
  `;

  apolloClient
    .mutate({
      mutation: CREATE_LESSON,
      variables: {
        roomID: roomID,
        userID: userID,
        semester: semester,
        moduleCode: moduleCode,
        lessonType: lessonType,
        classNo: classNo,
      },
    })
    .catch((err) => {
      console.error("CREATE_LESSON error: ", err.message);
    });
}

export async function deleteLesson(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  roomID: string | undefined,
  userID: number,
  semester: number,
  moduleCode: ModuleCode,
  lessonType: LessonType,
  classNo: ClassNo,
) {
  const DELETE_LESSON = gql`
    mutation DeleteLesson(
      $roomID: String
      $userID: Int!
      $semester: Int!
      $moduleCode: String!
      $lessonType: String!
      $classNo: String!
    ) {
      deleteLesson(
        roomID: $roomID
        userID: $userID
        semester: $semester
        moduleCode: $moduleCode
        lessonType: $lessonType
        classNo: $classNo
      )
    }
  `;
  apolloClient
    .mutate({
      mutation: DELETE_LESSON,
      variables: {
        roomID,
        userID,
        semester,
        moduleCode,
        lessonType,
        classNo,
      },
    })
    .catch((err) => {
      console.error("DELETE_LESSON error: ", err.message);
    });
}

export async function resetTimetable(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  roomID: string | undefined,
  userID: number,
  semester: number,
) {
  const RESET_TIMETABLE_MUTATION = gql`
    mutation ResetTimetable($roomID: String, $userID: Int!, $semester: Int!) {
      resetTimetable(roomID: $roomID, userID: $userID, semester: $semester)
    }
  `;

  apolloClient
    .mutate({
      mutation: RESET_TIMETABLE_MUTATION,
      variables: {
        roomID,
        userID,
        semester,
      },
    })
    .catch((err) => {
      console.error("RESET_TIMETABLE error: ", err.message);
    });
}

export async function deleteModule(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  roomID: string | undefined,
  userID: number,
  semester: number,
  moduleCode: string,
) {
  const DELETE_MODULE = gql`
    mutation DeleteModule(
      $roomID: String
      $userID: Int!
      $semester: Int!
      $moduleCode: String!
    ) {
      deleteModule(
        roomID: $roomID
        userID: $userID
        semester: $semester
        moduleCode: $moduleCode
      )
    }
  `;
  try {
    await apolloClient.mutate({
      mutation: DELETE_MODULE,
      variables: {
        roomID,
        userID,
        semester,
        moduleCode,
      },
    });
  } catch (err) {
    console.error("DELETE_MODULE error: ", err.message);
  }
}

export async function updateConfig(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  roomID: string | undefined,
  userID: number,
  config: TimetableGeneratorConfig,
) {
  const query = gql`
    mutation UpdateConfig($roomID: String, $userID: Int!, $data: String!) {
      updateConfig(roomID: $roomID, userID: $userID, data: $data)
    }
  `;

  try {
    await apolloClient.mutate({
      mutation: query,
      variables: {
        roomID,
        userID,
        data: JSON.stringify(config),
      },
    });
  } catch (err) {
    console.error("UPDATE_CONFIG error: ", err.message);
    alert(err.message);
  }
}

export function subscribeToLessonChanges(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  roomID: string,
  callback: (arg: LessonChange) => void,
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
          callback(data.data.lessonChange as LessonChange);
        }
      },
      error(error) {
        console.log("Apollo subscribe error", error);
      },
      complete() {},
    });
}

export function subscribeToUserChanges(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  roomID: string,
  callback: (data: UserChange) => void,
) {
  const USER_CHANGE_SUBSCRIPTION = gql`
    subscription UserChange($roomID: String!) {
      userChange(roomID: $roomID) {
        action
        userID
        name
        isAuth
      }
    }
  `;

  apolloClient
    .subscribe({
      query: USER_CHANGE_SUBSCRIPTION,
      variables: {
        roomID: roomID,
      },
    })
    .subscribe({
      next(data) {
        if (data.data) {
          callback(data.data.userChange as UserChange);
        }
      },
      error(error) {
        console.log("Apollo subscribe error", error);
      },
      complete() {},
    });
}

export function subscribeToConfigChanges(
  apolloClient: ApolloClient<NormalizedCacheObject>,
  userID: number,
  callback: (data: TimetableGeneratorConfig) => void,
) {
  const query = gql`
    subscription ConfigChange($userID: Int!) {
      configChange(userID: $userID)
    }
  `;

  apolloClient
    .subscribe({
      query: query,
      variables: {
        userID,
      },
    })
    .subscribe({
      next(data) {
        if (data.data) {
          const config = JSON.parse(
            data.data.configChange,
          ) as TimetableGeneratorConfig;
          callback(config);
        }
      },
      error(error) {
        console.log("Apollo subscribe error", error);
      },
      complete() {},
    });
}
