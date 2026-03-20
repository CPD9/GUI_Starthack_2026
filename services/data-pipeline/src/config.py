from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "start-hack-data-pipeline"
    app_version: str = "0.1.0"


settings = Settings()
