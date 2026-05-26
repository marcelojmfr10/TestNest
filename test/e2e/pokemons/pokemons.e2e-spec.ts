import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../../src/app.module';
import { Pokemon } from 'src/pokemons/entities/pokemon.entity';

describe('Pokemons (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  it('/pokemons (POST) - with no body', async () => {
    const response = await request(app.getHttpServer()).post('/pokemons');

    const messageArray = response.body.message ?? [];

    expect(response.statusCode).toBe(400);
    expect(messageArray).toContain('name must be a string');
    expect(messageArray).toContain('type must be a string');
    expect(messageArray).toContain('name should not be empty');
    expect(messageArray).toContain('type should not be empty');

    // return request(app.getHttpServer())
    //     .post('/pokemons')
    //     .expect(400)
    //     .expect('Hello World!');
  });

  it('/pokemons (POST) - with no body 2', async () => {
    const response = await request(app.getHttpServer()).post('/pokemons');

    const mostHaveErrorMessage = [
      'name must be a string',
      'name should not be empty',
      'type must be a string',
      'type should not be empty',
    ];

    const messageArray: string[] = response.body.message ?? [];

    // expect(mostHaveErrorMessage).toEqual(messageArray);
    expect(mostHaveErrorMessage.length).toBe(messageArray.length);
    expect(messageArray).toEqual(expect.arrayContaining(mostHaveErrorMessage));
  });

  it('/pokemons (POST) - with valid body', async () => {
    const response = await request(app.getHttpServer()).post('/pokemons').send({
      name: 'prueba',
      type: 'electric',
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({
      name: 'prueba',
      type: 'electric',
      hp: 0,
      sprites: [],
      id: expect.any(Number),
    });
  });

  it('/pokemons (GET) should return paginated list of pokemons', async () => {
    const response = await request(app.getHttpServer())
      .get('/pokemons')
      .query({ limit: 5, page: 1 });

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(5);

    (response.body as Pokemon[]).forEach((poke) => {
      expect(poke).toHaveProperty('id');
      expect(poke).toHaveProperty('name');
      expect(poke).toHaveProperty('type');
      expect(poke).toHaveProperty('hp');
      expect(poke).toHaveProperty('sprites');
    });
  });

  it('/pokemons (GET) should return 20 paginated pokemons', async () => {
    const response = await request(app.getHttpServer())
      .get('/pokemons')
      .query({ limit: 20, page: 1 });

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(20);

    // (response.body as Pokemon[]).forEach(poke => {
    //     expect(poke).toHaveProperty('id');
    //     expect(poke).toHaveProperty('name');
    //     expect(poke).toHaveProperty('type');
    //     expect(poke).toHaveProperty('hp');
    //     expect(poke).toHaveProperty('sprites');
    // });
  });

  it('/pokemons/:id (GET) should return a pokemon by id', async () => {
    const response = await request(app.getHttpServer()).get('/pokemons/1');

    const pokemon = response.body as Pokemon;

    expect(response.statusCode).toBe(200);
    expect(pokemon).toEqual({
      id: 1,
      name: 'bulbasaur',
      type: 'grass',
      hp: 45,
      sprites: [
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/1.png',
      ],
    });
  });

  it('/pokemons/:id (GET) should return not found', async () => {
    const pokemonId = 400_000;
    const response = await request(app.getHttpServer()).get(
      `/pokemons/${pokemonId}`,
    );

    const pokemon = response.body as Pokemon;

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      message: `Pokemon with id ${pokemonId} not found`,
      error: 'Not Found',
      statusCode: 404,
    });
  });

  it('/pokemons/:id (PATCH) should update pokemon', async () => {
    const pokemonId = 1;
    const dto = {
      name: 'prueba',
      type: 'electric',
    };

    const pokemonResponse = await request(app.getHttpServer()).get(
      `/pokemons/${pokemonId}`,
    );

    const bulbasaur = pokemonResponse.body as Pokemon;

    const response = await request(app.getHttpServer())
      .patch(`/pokemons/${pokemonId}`)
      .send(dto);

    const updatedPokemon = response.body as Pokemon;
    // expect(bulbasaur).toEqual(updatedPokemon);
    expect(bulbasaur.hp).toBe(updatedPokemon.hp);
    expect(bulbasaur.id).toBe(updatedPokemon.id);
    expect(bulbasaur.sprites).toEqual(updatedPokemon.sprites);
    expect(dto.name).toBe(updatedPokemon.name);
    expect(dto.type).toBe(updatedPokemon.type);
  });

  it('/pokemons/:id (PATCH) should throw an 404', async () => {
    const pokemonId = 400_000;
    const response = await request(app.getHttpServer())
      .patch(`/pokemons/${pokemonId}`)
      .send({});

    expect(response.statusCode).toBe(404);
  });

  it('/pokemons/:id (DELETE) should delete pokemon', async () => {
    const pokemonId = 1;
    const response = await request(app.getHttpServer()).delete(
      `/pokemons/${pokemonId}`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe(`Pokemon bulbasaur removed!`);
  });

  it('/pokemons/:id (DELETE) should throw an 404', async () => {
    const pokemonId = 400_000;
    const response = await request(app.getHttpServer()).delete(
      `/pokemons/${pokemonId}`,
    );

    expect(response.statusCode).toBe(404);
  });
});
