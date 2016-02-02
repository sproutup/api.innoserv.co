create table user (
      id                        bigint auto_increment not null,
      email                     varchar(255),
      display_name              varchar(255),
      first_name                varchar(255),
      last_name                 varchar(255),
      username                  varchar(255),
      password                  varchar(255),
      salt                      varchar(255),
      profile_image_url         varchar(255),
      provider                  varchar(255),
      created_at                datetime,
      updated_at                datetime,
      reset_password_token      varchar(255),
      reset_password_expires    datetime,
      constraint pk_users primary key (id)
);

