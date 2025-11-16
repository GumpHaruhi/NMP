package database

import (
    "context"

    "NMP/core"

    "gorm.io/gorm"
)

// MusicRepo 基于 GORM 的简单仓库，用于对 music 表进行 CRUD
type MusicRepo struct {
    DB *gorm.DB
}

// NewMusicRepo 创建仓库
func NewMusicRepo(db *gorm.DB) *MusicRepo {
    return &MusicRepo{DB: db}
}

// Create 插入一条音乐记录，插入后会把自增 ID 写回 m.Id
func (r *MusicRepo) Create(ctx context.Context, m *core.Music) error {
    return r.DB.WithContext(ctx).Create(m).Error
}

// GetByID 根据 ID 查询
func (r *MusicRepo) GetByID(ctx context.Context, id int64) (*core.Music, error) {
    var m core.Music
    if err := r.DB.WithContext(ctx).First(&m, id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            return nil, nil
        }
        return nil, err
    }
    return &m, nil
}

// List 分页查询
func (r *MusicRepo) List(ctx context.Context, offset, limit int) ([]core.Music, error) {
    var list []core.Music
    if err := r.DB.WithContext(ctx).Offset(offset).Limit(limit).Find(&list).Error; err != nil {
        return nil, err
    }
    return list, nil
}

// Update 更新一条记录（以主键为准）
func (r *MusicRepo) Update(ctx context.Context, m *core.Music) error {
    return r.DB.WithContext(ctx).Save(m).Error
}

// Delete 根据 ID 删除记录
func (r *MusicRepo) Delete(ctx context.Context, id int64) error {
    return r.DB.WithContext(ctx).Delete(&core.Music{}, id).Error
}
