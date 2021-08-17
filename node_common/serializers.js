export const user = (entity) => {
  return {
    type: "USER",
    id: entity.id,
    username: entity.username,
    slates: entity.slates ? entity.slates : [],
    data: {
      name: entity.data.name ? entity.data.name : "",
      photo: entity.data.photo ? entity.data.photo : "",
      body: entity.data.body ? entity.data.body : "",
    },
  };
};

export const slate = (entity) => {
  return {
    type: "SLATE",
    id: entity.id,
    slatename: entity.slatename,
    data: {
      ownerId: entity.data.ownerId,
      name: entity.data.name ? entity.data.name : "",
      body: entity.data.body ? entity.data.body : "",
      objects: entity.data.objects,
      layouts: entity.data.layouts,
    },
  };
};
