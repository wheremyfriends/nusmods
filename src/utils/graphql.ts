import { ApolloClient, NormalizedCacheObject, gql } from "@apollo/client";

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
