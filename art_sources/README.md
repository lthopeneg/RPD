# Art sources

`images/` contains original generated sheets and intermediate image files. It is a local working library and is excluded from Git because the optimized runtime assets already live in `src/images/`.

Runtime assets imported by React and CSS belong in `src/images/`. Keep source files here so the production bundle only scans final assets and the originals remain available for later sprite rework.

Run `scripts/normalize_boss_sprites.py` after replacing one of the boss source sheets. The generated game sheets are written to `src/images/`.

The other scripts in `scripts/` rebuild the stage 5 boss and regular monster sheets. Keep the source filenames referenced by those scripts when replacing local artwork:

- `build_stage05_walk_sprite.py`: stage 5 boss directional strips
- `build_enemy_human_sprite.py`: human monster sheet
- `build_enemy_land_sprite.py`: land monster directional strips
