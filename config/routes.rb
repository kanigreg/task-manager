Rails.application.routes.draw do
  root :to => "web/boards#show"

  mount LetterOpenerWeb::Engine, at: "/letter_opener" if Rails.env.development?

  scope module: :web do
    resource :board, only: :show
    resource :session, only: [:new, :create, :destroy]
    resource :developers, only: [:new, :create]
    resources :password_resets, only: [:new, :create, :show, :update], constraints: { id: /[[:alnum:][:punct:]]+/ }
  end

  namespace :admin do
    resources :users
  end

  namespace :api do
    namespace :v1 do
      resources :tasks, only: [:index, :show, :create, :update, :destroy]
    end
  end
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
end
