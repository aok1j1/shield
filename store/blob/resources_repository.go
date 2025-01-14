package blob

import (
	"context"
	"io"
	"strings"
	"sync"
	"time"

	"github.com/odpf/salt/log"

	"github.com/robfig/cron/v3"

	"github.com/ghodss/yaml"
	"github.com/odpf/shield/store"
	"github.com/odpf/shield/structs"
	"github.com/pkg/errors"
	"gocloud.dev/blob"
)

type Resources struct {
	Resources []Resource `json:"resources" yaml:"resources"`
}

type Resource struct {
	Name    string              `json:"name" yaml:"name"`
	Actions map[string][]string `json:"actions" yaml:"actions"`
}

type ResourcesRepository struct {
	log log.Logger
	mu  *sync.Mutex

	cron   *cron.Cron
	bucket store.Bucket
	cached []structs.Resource
}

func (repo *ResourcesRepository) GetAll(ctx context.Context) ([]structs.Resource, error) {
	repo.mu.Lock()
	currentCache := repo.cached
	repo.mu.Unlock()
	if repo.cron != nil {
		// cache must have been refreshed automatically, just return
		return currentCache, nil
	}

	err := repo.refresh(ctx)
	return repo.cached, err
}

func (repo *ResourcesRepository) refresh(ctx context.Context) error {
	var resources []structs.Resource

	// get all items
	it := repo.bucket.List(&blob.ListOptions{})
	for {
		obj, err := it.Next(ctx)
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}

		if obj.IsDir {
			continue
		}
		if !(strings.HasSuffix(obj.Key, ".yaml") || strings.HasSuffix(obj.Key, ".yml")) {
			continue
		}
		fileBytes, err := repo.bucket.ReadAll(ctx, obj.Key)
		if err != nil {
			return errors.Wrap(err, "bucket.ReadAll: "+obj.Key)
		}

		var resource Resources
		if err := yaml.Unmarshal(fileBytes, &resource); err != nil {
			return errors.Wrap(err, "yaml.Unmarshal: "+obj.Key)
		}
		if len(resource.Resources) == 0 {
			continue
		}

		for _, res := range resource.Resources {
			resources = append(resources, structs.Resource{
				Name:    res.Name,
				Actions: res.Actions,
			})
		}
	}

	repo.mu.Lock()
	repo.cached = resources
	repo.mu.Unlock()
	repo.log.Debug("resource config cache refreshed", "resource_config_count", len(repo.cached))
	return nil
}

func (repo *ResourcesRepository) InitCache(ctx context.Context, refreshDelay time.Duration) error {
	repo.cron = cron.New(cron.WithChain(
		cron.SkipIfStillRunning(cron.DefaultLogger),
	))
	if _, err := repo.cron.AddFunc("@every "+refreshDelay.String(), func() {
		if err := repo.refresh(ctx); err != nil {
			repo.log.Warn("failed to refresh resource config repository", "err", err)
		}
	}); err != nil {
		return err
	}
	repo.cron.Start()

	// do it once right now
	return repo.refresh(ctx)
}

func (repo *ResourcesRepository) Close() error {
	<-repo.cron.Stop().Done()
	return repo.bucket.Close()
}

func NewResourcesRepository(logger log.Logger, b store.Bucket) *ResourcesRepository {
	return &ResourcesRepository{
		log:    logger,
		bucket: b,
		mu:     new(sync.Mutex),
	}
}
