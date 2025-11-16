package core

func GetAllMusic() ([]Music, error) {
	var musics []Music
	result := DB.Order("id ASC").Find(&musics)
	if result.Error != nil {
		return nil, result.Error
	}
	return musics, nil
}
